import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  addDashboardVehicle,
  getDashboard,
  getDashboardAudit,
  removeDashboardVehicle,
  runDashboardRenewal,
  updateDashboardAccount,
  WebServiceError,
} from './dashboard-service.js';

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const MAX_BODY_BYTES = 64 * 1024;
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthenticated(request, username, password) {
  if (!username && !password) return true;
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Basic ')) return false;
  let credentials;
  try {
    credentials = Buffer.from(authorization.slice(6), 'base64').toString();
  } catch {
    return false;
  }
  const separator = credentials.indexOf(':');
  if (separator < 0) return false;
  return (
    safeEqual(credentials.slice(0, separator), username) &&
    safeEqual(credentials.slice(separator + 1), password)
  );
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

async function handleApi(request, response, url) {
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
  if (request.method === 'POST' && url.pathname === '/api/vehicles') {
    const body = await readJsonBody(request);
    const data = await addDashboardVehicle(body.accountId, body);
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
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  const accountMatch = url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
  if (request.method === 'PATCH' && accountMatch) {
    const body = await readJsonBody(request);
    const data = updateDashboardAccount(
      decodeURIComponent(accountMatch[1]),
      body,
    );
    sendJson(response, 200, { success: true, data });
    return true;
  }
  if (request.method === 'POST' && url.pathname === '/api/renewals') {
    const body = await readJsonBody(request);
    const data = await runDashboardRenewal(body.accountId, body);
    sendJson(response, 200, { success: true, data });
    return true;
  }
  return false;
}

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
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

export function createDashboardServer({ username = '', password = '' } = {}) {
  return createServer(async (request, response) => {
    try {
      if (!isAuthenticated(request, username, password)) {
        response.writeHead(401, {
          'WWW-Authenticate': 'Basic realm="auto-beijing-pass"',
        });
        response.end('需要登录');
        return;
      }
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      if (url.pathname.startsWith('/api/')) {
        const handled = await handleApi(request, response, url);
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
} = {}) {
  const localHosts = new Set(['127.0.0.1', '::1', 'localhost']);
  if (!localHosts.has(host) && (!username || !password)) {
    throw new Error(
      '监听非本机地址时必须设置 ' +
      'AUTO_BJ_PASS_WEB_USERNAME 和 AUTO_BJ_PASS_WEB_PASSWORD',
    );
  }
  const server = createDashboardServer({ username, password });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return server;
}
