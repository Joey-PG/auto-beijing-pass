import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { readAuditEvents } from '../src/lib/audit-logger.js';
import { saveConfig } from '../src/lib/config-manager.js';
import {
  createDashboardServer,
  startDashboardServer,
} from '../src/web/server.js';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

test('web server serves the dashboard with security headers', async () => {
  const server = createDashboardServer();
  const baseUrl = await listen(server);
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
    assert.match(html, /车辆续签管理/);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('web server uses a login session without triggering browser basic auth', async () => {
  const auditEvents = [];
  const server = createDashboardServer({
    auditWriter: (event, fields) => auditEvents.push({ event, ...fields }),
    username: 'operator',
    password: 'secret-value',
  });
  const baseUrl = await listen(server);
  try {
    const loginPage = await fetch(baseUrl);
    assert.equal(loginPage.status, 200);
    assert.equal(loginPage.headers.get('www-authenticate'), null);

    const denied = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(denied.status, 401);
    assert.equal(denied.headers.get('www-authenticate'), null);

    const wrongLogin = await fetch(`${baseUrl}/api/auth/login`, {
      body: JSON.stringify({ username: 'operator', password: 'wrong' }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    assert.equal(wrongLogin.status, 401);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      body: JSON.stringify({ username: 'operator', password: 'secret-value' }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie');
    assert.match(cookie, /auto_bj_pass_session=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);

    const session = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: cookie },
    });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).data.authenticated, true);

    const allowed = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Cookie: cookie },
    });
    assert.equal(allowed.status, 404);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      headers: { Cookie: cookie },
      method: 'POST',
    });
    assert.equal(logout.status, 200);

    const expired = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Cookie: cookie },
    });
    assert.equal(expired.status, 401);
    assert.deepEqual(
      auditEvents.map(({ event, actor, result }) => ({ event, actor, result })),
      [
        { event: 'web_login_failed', actor: 'operator', result: 'failure' },
        { event: 'web_login_succeeded', actor: 'operator', result: 'success' },
        { event: 'web_logout', actor: 'operator', result: 'success' },
      ],
    );
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('web server accepts multiple hashed login accounts', async () => {
  const users = [
    { username: 'zhaochunxu', password: 'first-secret', salt: '11'.repeat(16) },
    { username: 'zhaoyue', password: 'second-secret', salt: '22'.repeat(16) },
  ].map(({ username, password, salt }) => ({
    passwordHash: scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex'),
    salt,
    username,
  }));
  const auditEvents = [];
  const server = createDashboardServer({
    auditWriter: (event, fields) => auditEvents.push({ event, ...fields }),
    users,
  });
  const baseUrl = await listen(server);
  try {
    for (const [username, password] of [
      ['zhaochunxu', 'first-secret'],
      ['zhaoyue', 'second-secret'],
    ]) {
      const login = await fetch(`${baseUrl}/api/auth/login`, {
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      assert.equal(login.status, 200);
      const cookie = login.headers.get('set-cookie');
      const session = await fetch(`${baseUrl}/api/auth/session`, {
        headers: { Cookie: cookie },
      });
      assert.equal((await session.json()).data.username, username);
    }

    const removedAccount = await fetch(`${baseUrl}/api/auth/login`, {
      body: JSON.stringify({ username: 'admin', password: 'old-password' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    assert.equal(removedAccount.status, 401);
    assert.deepEqual(
      auditEvents.map(({ event, actor }) => ({ event, actor })),
      [
        { event: 'web_login_succeeded', actor: 'zhaochunxu' },
        { event: 'web_login_succeeded', actor: 'zhaoyue' },
        { event: 'web_login_failed', actor: 'admin' },
      ],
    );
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('web mutations write the authenticated administrator to audit logs', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-actor-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  saveConfig({
    users: [{
      auth: 'test-token',
      auto_renew: true,
      bjt_phone: '13800000001',
      entry_type: '六环外',
      name: '测试账号',
    }],
  });
  const server = createDashboardServer({
    auditWriter: () => {},
    password: 'secret-value',
    username: 'zhaoyue',
  });
  const baseUrl = await listen(server);
  try {
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      body: JSON.stringify({ username: 'zhaoyue', password: 'secret-value' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await fetch(`${baseUrl}/api/accounts/1`, {
      body: JSON.stringify({ autoRenew: false }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: login.headers.get('set-cookie'),
      },
      method: 'PATCH',
    });
    assert.equal(response.status, 200);
    const [event] = readAuditEvents({ since: '1d', limit: 10 });
    assert.equal(event.event, 'config_changed');
    assert.equal(event.actor, 'zhaoyue');
    assert.equal(event.account, '测试账号');
  } finally {
    server.close();
    await once(server, 'close');
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('remote bind requires explicit dashboard credentials', async () => {
  await assert.rejects(
    startDashboardServer({ host: '0.0.0.0', port: 3751 }),
    /必须设置 AUTO_BJ_PASS_WEB_USERS_FILE/,
  );
});
