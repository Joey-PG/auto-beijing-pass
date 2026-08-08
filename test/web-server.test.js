import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

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

test('web server enforces configured basic authentication', async () => {
  const server = createDashboardServer({
    username: 'operator',
    password: 'secret-value',
  });
  const baseUrl = await listen(server);
  try {
    const denied = await fetch(baseUrl);
    assert.equal(denied.status, 401);

    const allowed = await fetch(baseUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from('operator:secret-value').toString('base64')}`,
      },
    });
    assert.equal(allowed.status, 200);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('remote bind requires explicit dashboard credentials', async () => {
  await assert.rejects(
    startDashboardServer({ host: '0.0.0.0', port: 3751 }),
    /必须设置 AUTO_BJ_PASS_WEB_USERNAME/,
  );
});
