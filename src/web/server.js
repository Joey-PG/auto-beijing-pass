import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeAuditEvent } from '../lib/audit-logger.js';
import { getConfigDir } from '../lib/config-manager.js';

import {
  addDashboardAccount,
  addDashboardVehicle,
  getDashboard,
  getDashboardAudit,
  reloginDashboardAccount,
  removeDashboardAccount,
  removeDashboardVehicle,
  runDashboardRenewal,
  updateDashboardAccount,
  updateDashboardTripProfile,
  WebServiceError,
} from './dashboard-service.js';
import { SessionStore } from './session-store.js';

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const SPA_ROUTES = new Set([
  '/',
  '/accounts',
  '/audit',
  '/logs',
  '/system',
  '/vehicles',
]);
const MAX_BODY_BYTES = 64 * 1024;
const SESSION_COOKIE = 'auto_bj_pass_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const PASSWORD_HASH_BYTES = 64;
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, data, headers = {}) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(data));
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeAuthenticators({ password = '', username = '', users = [] }) {
  const authenticators = [];
  const names = new Set();
  for (const user of users) {
    const name = String(user.username || '').trim();
    if (!name || names.has(name)) {
      throw new Error('Web 登录账号配置包含空用户名或重复用户名');
    }
    const salt = String(user.salt || '');
    const passwordHash = String(user.passwordHash || '');
    if (!/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(passwordHash)) {
      throw new Error(`Web 登录账号 ${name} 的密码哈希配置无效`);
    }
    names.add(name);
    authenticators.push({ name, passwordHash, salt });
  }
  if (authenticators.length === 0 && (username || password)) {
    authenticators.push({ name: String(username), password: String(password) });
  }
  return authenticators;
}

function verifyCredentials(username, password, authenticators) {
  const authenticator = authenticators.find((candidate) =>
    safeEqual(candidate.name, username),
  );
  if (!authenticator) {
    if (authenticators.some((candidate) => candidate.passwordHash)) {
      scryptSync(String(password), Buffer.alloc(16), PASSWORD_HASH_BYTES);
    }
    return null;
  }
  if (authenticator.passwordHash) {
    const actual = scryptSync(
      String(password),
      Buffer.from(authenticator.salt, 'hex'),
      PASSWORD_HASH_BYTES,
    );
    const expected = Buffer.from(authenticator.passwordHash, 'hex');
    return timingSafeEqual(actual, expected) ? authenticator.name : null;
  }
  return safeEqual(authenticator.password, password) ? authenticator.name : null;
}

function getBasicAuthenticatedUsername(request, authenticators) {
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Basic ')) return null;
  let credentials;
  try {
    credentials = Buffer.from(authorization.slice(6), 'base64').toString();
  } catch {
    return null;
  }
  const separator = credentials.indexOf(':');
  if (separator < 0) return null;
  return verifyCredentials(
    credentials.slice(0, separator),
    credentials.slice(separator + 1),
    authenticators,
  );
}

function parseCookies(request) {
  const cookies = {};
  for (const part of String(request.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) cookies[name] = value;
  }
  return cookies;
}

function getSession(request, sessions, authenticators) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (
    authenticators.length > 0 &&
    !authenticators.some((authenticator) => authenticator.name === session.username)
  ) {
    sessions.delete(token);
    return null;
  }
  return { ...session, token };
}

function isAuthenticated(request, authenticators, sessions) {
  if (authenticators.length === 0) return true;
  return Boolean(getSession(request, sessions, authenticators)) ||
    Boolean(getBasicAuthenticatedUsername(request, authenticators));
}

function getClientAddress(request) {
  const forwarded = String(request.headers['x-real-ip'] || '').trim();
  return forwarded || request.socket.remoteAddress || 'unknown';
}

function isSecureRequest(request) {
  const forwarded = String(request.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim();
  return forwarded === 'https' || Boolean(request.socket.encrypted);
}

function createSessionCookie(token, request) {
  const secure = isSecureRequest(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(request) {
  const secure = isSecureRequest(request) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

async function handleAuth(request, response, url, context) {
  const { auditWriter, authenticators, loginAttempts, sessions } = context;
  const authenticationEnabled = authenticators.length > 0;

  if (request.method === 'GET' && url.pathname === '/api/auth/session') {
    const session = getSession(request, sessions, authenticators);
    sendJson(response, 200, {
      success: true,
      data: {
        authenticated: !authenticationEnabled || Boolean(session),
        username: session?.username || (!authenticationEnabled ? '本机管理员' : ''),
      },
    });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    if (!isSafeOrigin(request)) {
      throw new WebServiceError('请求来源校验失败', 403);
    }
    if (!authenticationEnabled) {
      auditWriter('web_login_succeeded', {
        actor: '本机管理员',
        result: 'success',
        source: 'web',
      });
      sendJson(response, 200, {
        success: true,
        data: { authenticated: true, username: '本机管理员' },
      });
      return true;
    }

    const address = getClientAddress(request);
    const now = Date.now();
    const attempt = loginAttempts.get(address);
    const body = await readJsonBody(request);
    const attemptedUsername = String(body.username || '').trim();
    if (attempt?.blockedUntil > now) {
      auditWriter('web_login_blocked', {
        actor: attemptedUsername || null,
        address,
        reason: 'too_many_attempts',
        result: 'failure',
        source: 'web',
      }, { level: 'warning' });
      sendJson(response, 429, {
        success: false,
        message: '登录失败次数过多，请稍后再试',
      });
      return true;
    }

    const authenticatedUsername = verifyCredentials(
      attemptedUsername,
      body.password || '',
      authenticators,
    );
    if (!authenticatedUsername) {
      const withinWindow = attempt && now - attempt.startedAt < LOGIN_WINDOW_MS;
      const failures = withinWindow ? attempt.failures + 1 : 1;
      const blockedUntil = failures >= MAX_LOGIN_FAILURES
        ? now + LOGIN_BLOCK_MS
        : 0;
      loginAttempts.set(address, {
        blockedUntil,
        failures,
        startedAt: withinWindow ? attempt.startedAt : now,
      });
      auditWriter('web_login_failed', {
        actor: attemptedUsername || null,
        address,
        reason: 'invalid_credentials',
        result: 'failure',
        source: 'web',
      }, { level: 'warning' });
      sendJson(response, 401, {
        success: false,
        message: blockedUntil
          ? '登录失败次数过多，请稍后再试'
          : '用户名或密码不正确',
      });
      return true;
    }

    loginAttempts.delete(address);
    const token = randomBytes(32).toString('base64url');
    sessions.create(token, {
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
      username: authenticatedUsername,
    });
    auditWriter('web_login_succeeded', {
      actor: authenticatedUsername,
      address,
      result: 'success',
      source: 'web',
    });
    sendJson(
      response,
      200,
      { success: true, data: { authenticated: true, username: authenticatedUsername } },
      { 'Set-Cookie': createSessionCookie(token, request) },
    );
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    if (!isSafeOrigin(request)) {
      throw new WebServiceError('请求来源校验失败', 403);
    }
    const session = getSession(request, sessions, authenticators);
    auditWriter('web_logout', {
      actor: session?.username || null,
      address: getClientAddress(request),
      result: 'success',
      source: 'web',
    });
    if (session) sessions.delete(session.token);
    sendJson(
      response,
      200,
      { success: true, data: { loggedOut: true } },
      { 'Set-Cookie': clearSessionCookie(request) },
    );
    return true;
  }

  return false;
}

function isSafeOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new WebServiceError('请求内容过大', 413);
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new WebServiceError('请求内容必须是有效 JSON', 400);
  }
}

async function handleApi(request, response, url, { actor = null } = {}) {
  if (request.method !== 'GET' && !isSafeOrigin(request)) {
    throw new WebServiceError('请求来源校验失败', 403);
  }
  if (request.method === 'GET' && url.pathname === '/api/dashboard') {
    sendJson(response, 200, { success: true, data: await getDashboard() });
    return true;
  }
  if (request.method === 'GET' && url.pathname === '/api/audit') {
    const data = getDashboardAudit(Object.fromEntries(url.searchParams));
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'POST' && url.pathname === '/api/accounts') {
    const body = await readJsonBody(request);
    const data = await addDashboardAccount(body, { actor });
    sendJson(response, 201, { success: true, data });
    return true;
  }
  if (request.method === 'POST' && url.pathname === '/api/vehicles') {
    const body = await readJsonBody(request);
    const data = await addDashboardVehicle(body.accountId, body, { actor });
    sendJson(response, 201, { success: true, data });
    return true;
  }
  const vehicleMatch = url.pathname.match(
    /^\/api\/vehicles\/([^/]+)\/([^/]+)$/,
  );
  if (request.method === 'DELETE' && vehicleMatch) {
    const data = await removeDashboardVehicle(
      decodeURIComponent(vehicleMatch[1]),
      decodeURIComponent(vehicleMatch[2]),
      { actor },
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  const accountMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
  const accountLoginMatch = url.pathname.match(
    /^\/api\/accounts\/([^/]+)\/login$/,
  );
  const accountTripProfileMatch = url.pathname.match(
    /^\/api\/accounts\/([^/]+)\/trip-profile$/,
  );
  if (request.method === 'POST' && accountLoginMatch) {
    const body = await readJsonBody(request);
    const data = await reloginDashboardAccount(
      decodeURIComponent(accountLoginMatch[1]),
      body,
      { actor },
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'PUT' && accountTripProfileMatch) {
    const body = await readJsonBody(request);
    const data = updateDashboardTripProfile(
      decodeURIComponent(accountTripProfileMatch[1]),
      body,
      { actor },
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'PATCH' && accountMatch) {
    const body = await readJsonBody(request);
    const data = updateDashboardAccount(
      decodeURIComponent(accountMatch[1]),
      body,
      { actor },
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'DELETE' && accountMatch) {
    const data = removeDashboardAccount(
      decodeURIComponent(accountMatch[1]),
      { actor },
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'POST' && url.pathname === '/api/renewals') {
    const body = await readJsonBody(request);
    const data = await runDashboardRenewal(body.accountId, body, { actor });
    sendJson(response, 200, { success: true, data });
    return true;
  }
  return false;
}

async function serveStatic(response, pathname) {
  const routePath = pathname.replace(/\/+$/, '') || '/';
  const requested = SPA_ROUTES.has(routePath) ? 'index.html' : pathname.slice(1);
  const normalized = normalize(requested);
  if (normalized.startsWith('..') || normalize(normalized) !== normalized) {
    return false;
  }
  const path = join(WEB_ROOT, normalized);
  try {
    const content = await readFile(path);
    response.writeHead(200, {
      'Cache-Control': normalized === 'index.html' ? 'no-cache' : 'public, max-age=3600',
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
      'Content-Type': CONTENT_TYPES[extname(path)] || 'application/octet-stream',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}

export function createDashboardServer({
  auditWriter = writeAuditEvent,
  sessionFile = '',
  username = '',
  password = '',
  users = [],
} = {}) {
  const sessions = new SessionStore({ filePath: sessionFile });
  const loginAttempts = new Map();
  const authenticators = normalizeAuthenticators({ password, username, users });
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      if (url.pathname.startsWith('/api/')) {
        const authHandled = await handleAuth(request, response, url, {
          auditWriter,
          authenticators,
          loginAttempts,
          sessions,
        });
        if (authHandled) return;
        if (!isAuthenticated(request, authenticators, sessions)) {
          sendJson(response, 401, {
            success: false,
            message: '登录状态已失效，请重新登录',
          });
          return;
        }
        const session = getSession(request, sessions, authenticators);
        const actor = session?.username ||
          getBasicAuthenticatedUsername(request, authenticators) ||
          (authenticators.length === 0 ? '本机管理员' : null);
        const handled = await handleApi(request, response, url, { actor });
        if (!handled) sendJson(response, 404, { success: false, message: '接口不存在' });
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405).end();
        return;
      }
      if (!(await serveStatic(response, url.pathname))) {
        response.writeHead(404).end('页面不存在');
      }
    } catch (error) {
      const statusCode = error instanceof WebServiceError
        ? error.statusCode
        : 500;
      const message = error instanceof Error ? error.message : '服务器内部错误';
      sendJson(response, statusCode, { success: false, message });
    }
  });
}

export async function startDashboardServer({
  host = '127.0.0.1',
  port = 3751,
  username =
    process.env.AUTO_BJ_PASS_WEB_USERNAME ||
    process.env.CROSS_BJ_WEB_USERNAME ||
    '',
  password =
    process.env.AUTO_BJ_PASS_WEB_PASSWORD ||
    process.env.CROSS_BJ_WEB_PASSWORD ||
    '',
  sessionFile =
    process.env.AUTO_BJ_PASS_WEB_SESSION_FILE ||
    join(getConfigDir(), 'web-sessions.json'),
  users = [],
  usersFile = process.env.AUTO_BJ_PASS_WEB_USERS_FILE || '',
} = {}) {
  let configuredUsers = users;
  if (configuredUsers.length === 0 && usersFile) {
    let payload;
    try {
      payload = JSON.parse(await readFile(usersFile, 'utf8'));
    } catch (error) {
      throw new Error(
        `无法读取 Web 登录账号文件 ${usersFile}: ${error instanceof Error ? error.message : error}`,
      );
    }
    if (!Array.isArray(payload.users) || payload.users.length === 0) {
      throw new Error('Web 登录账号文件必须包含至少一个账号');
    }
    configuredUsers = payload.users;
    normalizeAuthenticators({ users: configuredUsers });
  }
  const localHosts = new Set(['127.0.0.1', '::1', 'localhost']);
  if (!localHosts.has(host) && configuredUsers.length === 0 && (!username || !password)) {
    throw new Error(
      '监听非本机地址时必须设置 ' +
      'AUTO_BJ_PASS_WEB_USERS_FILE，或设置 AUTO_BJ_PASS_WEB_USERNAME 和 AUTO_BJ_PASS_WEB_PASSWORD',
    );
  }
  const server = createDashboardServer({
    sessionFile,
    username,
    password,
    users: configuredUsers,
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return server;
}
