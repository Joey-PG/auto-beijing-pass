import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  AutomaticLoginError,
  createAuthenticatedApi,
} from '../src/lib/authenticated-api.js';
import { readAuditEvents } from '../src/lib/audit-logger.js';
import { loadConfig, saveConfig } from '../src/lib/config-manager.js';

function apiResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function withConfigDir(prefix, operation) {
  const configDir = mkdtempSync(join(tmpdir(), prefix));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  return Promise.resolve()
    .then(() => operation(configDir))
    .finally(() => {
      delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
      rmSync(configDir, { recursive: true, force: true });
    });
}

test('refreshes an expired token with the encrypted Beijing Tong password', () =>
  withConfigDir('auto-bj-pass-auth-refresh-', async (configDir) => {
    saveConfig({
      users: [{
        name: '自动刷新账号',
        auth: 'expired-token',
        bjt_phone: '13800000001',
        bjt_pwd: 'encrypted-password',
        membership_permanent: true,
      }],
    });
    const requests = [];
    const api = createAuthenticatedApi(loadConfig().users[0], {
      fetchImpl: async (_url, options) => {
        requests.push(options.headers.Authorization);
        return options.headers.Authorization === 'expired-token'
          ? apiResponse({ code: 401, msg: 'token 已过期' })
          : apiResponse({ code: 200, data: { bzclxx: [] } });
      },
      loginFn: async (phone, password) => {
        assert.equal(phone, '13800000001');
        assert.equal(password, 'encrypted-password');
        return 'fresh-token';
      },
    });

    assert.deepEqual(await api.getStateData(), { bzclxx: [] });
    assert.deepEqual(requests, ['expired-token', 'fresh-token']);
    assert.equal(loadConfig().users[0].auth, 'fresh-token');
    assert.equal(loadConfig().users[0].bjt_pwd, 'encrypted-password');
    const stored = readFileSync(join(configDir, 'config.json'), 'utf8');
    assert.doesNotMatch(stored, /expired-token|fresh-token|encrypted-password/);
    assert.match(stored, /auth_encrypted/);
    assert.match(stored, /bjt_pwd_encrypted/);
    assert.equal(readAuditEvents({ since: '1d', limit: 10 }).at(-1).event,
      'account_token_refreshed');
  }));

test('coalesces concurrent token refreshes for one account', () =>
  withConfigDir('auto-bj-pass-auth-concurrent-', async () => {
    saveConfig({
      users: [{
        name: '并发账号',
        auth: 'expired-token',
        bjt_phone: '13800000002',
        bjt_pwd: 'saved-password',
        membership_permanent: true,
      }],
    });
    const user = loadConfig().users[0];
    let loginCalls = 0;
    const options = {
      fetchImpl: async (_url, request) =>
        request.headers.Authorization === 'expired-token'
          ? apiResponse({ code: 500, msg: '用户登录已失效，请重新登录' })
          : apiResponse({ code: 200, data: { bzclxx: [] } }),
      loginFn: async () => {
        loginCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'fresh-token';
      },
    };
    const first = createAuthenticatedApi(user, options);
    const second = createAuthenticatedApi({ ...user }, options);

    await Promise.all([first.getStateData(), second.getStateData()]);
    assert.equal(loginCalls, 1);
    assert.equal(loadConfig().users[0].auth, 'fresh-token');
  }));

test('requires one manual re-login when a migrated account has no password', () =>
  withConfigDir('auto-bj-pass-auth-missing-password-', async () => {
    saveConfig({
      users: [{
        name: '待补密码账号',
        auth: 'expired-token',
        bjt_phone: '13800000003',
        membership_permanent: true,
      }],
    });
    let loginCalls = 0;
    const api = createAuthenticatedApi(loadConfig().users[0], {
      fetchImpl: async () => apiResponse({}, 401),
      loginFn: async () => {
        loginCalls += 1;
        return 'unexpected-token';
      },
    });

    await assert.rejects(
      api.getStateData(),
      (error) =>
        error instanceof AutomaticLoginError && /重新登录一次/.test(error.message),
    );
    assert.equal(loginCalls, 0);
  }));

test('does not re-login for ordinary business errors', () =>
  withConfigDir('auto-bj-pass-auth-business-error-', async () => {
    saveConfig({
      users: [{
        name: '业务错误账号',
        auth: 'current-token',
        bjt_phone: '13800000004',
        bjt_pwd: 'saved-password',
        membership_permanent: true,
      }],
    });
    let loginCalls = 0;
    const api = createAuthenticatedApi(loadConfig().users[0], {
      fetchImpl: async () =>
        apiResponse({ code: 500, msg: '车辆已存在，不能重复绑定' }),
      loginFn: async () => {
        loginCalls += 1;
        return 'unexpected-token';
      },
    });

    await assert.rejects(api.getStateData(), /车辆已存在/);
    assert.equal(loginCalls, 0);
  }));

test('retries an authentication failure only once', () =>
  withConfigDir('auto-bj-pass-auth-single-retry-', async () => {
    saveConfig({
      users: [{
        name: '单次重试账号',
        auth: 'expired-token',
        bjt_phone: '13800000005',
        bjt_pwd: 'saved-password',
        membership_permanent: true,
      }],
    });
    let requests = 0;
    let loginCalls = 0;
    const api = createAuthenticatedApi(loadConfig().users[0], {
      fetchImpl: async () => {
        requests += 1;
        return apiResponse({ code: 401, msg: 'token 已过期' });
      },
      loginFn: async () => {
        loginCalls += 1;
        return 'still-invalid-token';
      },
    });

    await assert.rejects(api.getStateData(), /token 已过期/);
    assert.equal(requests, 2);
    assert.equal(loginCalls, 1);
  }));

test('keeps existing encrypted credentials when automatic login fails', () =>
  withConfigDir('auto-bj-pass-auth-refresh-failure-', async () => {
    saveConfig({
      users: [{
        name: '密码失效账号',
        auth: 'expired-token',
        bjt_phone: '13800000006',
        bjt_pwd: 'previous-password',
        membership_permanent: true,
        notify_urls: ['json://notification.example/hook'],
      }],
    });
    const notifications = [];
    const api = createAuthenticatedApi(loadConfig().users[0], {
      fetchImpl: async () => apiResponse({ code: 401, msg: '登录已失效' }),
      loginFn: async () => {
        throw new Error('密码错误');
      },
      notifyFn: async (urls, title, body) => {
        notifications.push({ body, title, urls });
      },
    });

    await assert.rejects(
      api.getStateData(),
      (error) =>
        error instanceof AutomaticLoginError && /自动重新登录失败/.test(error.message),
    );
    const [user] = loadConfig().users;
    assert.equal(user.auth, 'expired-token');
    assert.equal(user.bjt_pwd, 'previous-password');
    assert.equal(
      readAuditEvents({ since: '1d', limit: 10 }).at(-1).event,
      'account_token_refresh_failed',
    );
    assert.deepEqual(notifications, [{
      body: '密码错误\n请在 Web 账号管理或 CLI 中重新登录。',
      title: '[密码失效账号] 北京通登录失效',
      urls: ['json://notification.example/hook'],
    }]);
  }));
