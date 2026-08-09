import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { loadConfig, saveConfig } from '../src/lib/config-manager.js';
import { acquireRenewalLock } from '../src/lib/renewal-lock.js';
import {
  readAuditEvents,
  writeAuditEvent,
} from '../src/lib/audit-logger.js';
import {
  addDashboardAccount,
  extendDashboardMembership,
  getDashboard,
  getDashboardAudit,
  reloginDashboardAccount,
  removeDashboardAccount,
  runDashboardRenewal,
  updateDashboardAccount,
  updateDashboardTripProfile,
} from '../src/web/dashboard-service.js';

function apiResponse(data) {
  return {
    ok: true,
    json: async () => ({ code: 200, data }),
  };
}

test('dashboard aggregates account, vehicle configuration, and renewal history', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-dashboard-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalFetch = globalThis.fetch;
  process.env.AMAP_JS_KEY = 'test-map-key';
  process.env.AMAP_JS_SECURITY_CODE = 'test-security-code';

  try {
    saveConfig({
      users: [{
        auth: 'test-token',
        bjt_phone: '13800000001',
        entry_type: '六环外',
        preferred_vehicle: '京A12345',
        auto_renew: true,
      }],
    });
    globalThis.fetch = async (url) => {
      if (url.endsWith('/pro/vehicleController/getUserIdInfo')) {
        return apiResponse([{
          vId: 'vehicle-1',
          hphm: '京A12345',
          hpzl: '02',
          cllx: '01',
          fdjh: 'ABC123',
          ppxh: 'TEST',
          zcsj: '2024-01-02',
        }]);
      }
      if (url.endsWith('/pro/applyRecordController/stateList')) {
        return apiResponse({
          bzclxx: [{
            vId: 'vehicle-1',
            hphm: '京A12345',
            sycs: 8,
            syts: 20,
            bzxx: [{
              applyId: 'apply-1',
              blztmc: '审核通过(生效中)',
              yxqs: '2026-08-01',
              yxqz: '2026-08-07',
              sqsj: '2026-07-31 08:00:00',
            }],
          }],
        });
      }
      return apiResponse({});
    };
    writeAuditEvent('renewal_submitted', {
      account: '13800000001',
      plate: '京A12345',
      result: 'success',
      source: 'cron',
    });

    const dashboard = await getDashboard({
      securityContext: { localRequest: false, secureRequest: true },
    });
    const audit = getDashboardAudit({ since: '30d' });

    assert.equal(dashboard.summary.accountCount, 1);
    assert.equal(dashboard.summary.vehicleCount, 1);
    assert.deepEqual(dashboard.mapConfig, {
      enabled: true,
      key: 'test-map-key',
      securityCode: 'test-security-code',
    });
    assert.equal(dashboard.scheduler.counts.eligible, 1);
    assert.equal(
      dashboard.runtime.businessApiLastSuccessAt,
      dashboard.generatedAt,
    );
    assert.ok(dashboard.runtime.timeZone);
    assert.equal(dashboard.security.connection, 'https');
    assert.equal(
      dashboard.security.checks.find((check) => check.id === 'public_https')
        .status,
       'pass',
    );
    assert.equal(dashboard.accounts[0].name, '13800000001');
    assert.equal(dashboard.accounts[0].phone, '13800000001');
    assert.equal(dashboard.accounts[0].vehicles[0].engineNumber, '••••23');
    assert.equal(dashboard.accounts[0].vehicles[0].preferred, true);
    assert.equal(dashboard.accounts[0].vehicles[0].records[0].applyId, 'apply-1');
    assert.equal(
      dashboard.accounts[0].vehicles[0].lastExecution.event,
      'renewal_submitted',
    );
    assert.equal(audit.items[0].account, '13800000001');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AMAP_JS_KEY;
    delete process.env.AMAP_JS_SECURITY_CODE;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard updates only supported account renewal settings', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-config-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    saveConfig({
      users: [{
        name: '配置账号',
        auth: 'test-token',
        bjt_phone: '13800000001',
        entry_type: '六环外',
        auto_renew: true,
      }],
    });

    updateDashboardAccount('1', {
      autoRenew: false,
      entryType: '六环内',
      preferredVehicle: '京B12345',
    }, { actor: 'zhaoyue' });

    const user = loadConfig().users[0];
    assert.equal(user.auto_renew, false);
    assert.equal(user.entry_type, '六环内');
    assert.equal(user.preferred_vehicle, '京B12345');
    assert.throws(
      () => updateDashboardAccount(
        '1',
        { entryType: '不限区域' },
        { actor: 'zhaoyue' },
      ),
      /只能是六环内或六环外/,
    );
    const audit = readAuditEvents({ since: '1d', limit: 10 });
    assert.equal(audit.length, 2);
    assert.equal(audit[0].source, 'web');
    assert.equal(audit[0].actor, 'zhaoyue');
    assert.equal(audit[0].result, 'success');
    assert.equal(audit[1].source, 'web');
    assert.equal(audit[1].actor, 'zhaoyue');
    assert.equal(audit[1].result, 'failure');
    assert.equal(audit[1].error, '进京证类型只能是六环内或六环外');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard saves and validates account trip profiles', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-trip-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    saveConfig({
      users: [{
        name: '出行账号',
        auth: 'test-token',
        bjt_phone: '13800000001',
        auto_renew: false,
      }],
    });

    const input = {
      inBeijingAddress: '北京市朝阳区测试路 1 号',
      inBeijingLongitude: '116.40',
      inBeijingLatitude: '39.90',
      destinationAddress: '北京市海淀区测试路 2 号',
      destinationLongitude: '116.30',
      destinationLatitude: '39.95',
      destinationArea: '海淀区',
      districtCode: '008',
      purposeName: '其它',
      purposeCode: '06',
    };
    const result = updateDashboardTripProfile('1', input, {
      actor: 'zhaoyue',
    });

    assert.equal(result.updated, true);
    assert.equal(
      loadConfig().users[0].trip_profile.destination.address,
      input.destinationAddress,
    );
    assert.equal(
      loadConfig().users[0].trip_profile.current_location.longitude,
      input.inBeijingLongitude,
    );
    assert.equal(loadConfig().users[0].trip_profile_mode, 'custom');
    assert.throws(
      () => updateDashboardTripProfile(
        '1',
        { ...input, destinationLatitude: '200' },
        { actor: 'zhaoyue' },
      ),
      /目的地纬度无效/,
    );
    assert.doesNotThrow(() => updateDashboardAccount(
      '1',
      { autoRenew: true },
      { actor: 'zhaoyue' },
    ));

    const defaultResult = updateDashboardTripProfile(
      '1',
      { tripProfileMode: 'default' },
      { actor: 'zhaoyue' },
    );
    assert.equal(defaultResult.tripProfileMode, 'default');
    assert.equal(defaultResult.tripProfile.destination.area, '平谷区');
    assert.equal(loadConfig().users[0].trip_profile_mode, 'default');
    assert.equal(loadConfig().users[0].trip_profile, null);
    assert.doesNotThrow(() => updateDashboardAccount(
      '1',
      { autoRenew: true },
      { actor: 'zhaoyue' },
    ));
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard securely adds, edits, reauthenticates, and removes accounts', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-accounts-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    const created = await addDashboardAccount(
      {
        name: '新账号',
        phone: '13800000001',
        password: 'initial-secret',
        membershipTerm: '1y',
        tripProfileMode: 'default',
      },
      {
        actor: 'zhaochunxu',
        loginFn: async (phone, password) => {
          assert.equal(phone, '13800000001');
          assert.equal(password, 'initial-secret');
          return 'first-token';
        },
      },
    );
    assert.equal(created.id, '1');
    assert.deepEqual(loadConfig().users[0], {
      name: '新账号',
      auth: 'first-token',
      bjt_phone: '13800000001',
      entry_type: '六环外',
      notify_urls: [],
      preferred_vehicle: '',
      auto_renew: true,
      trip_profile_mode: 'default',
      trip_profile: null,
      membership_started_on: '2026-08-09',
      membership_expires_on: '2027-08-09',
      membership_permanent: false,
    });

    updateDashboardAccount(
      '1',
      {
        name: '家庭账号',
        entryType: '六环内',
        autoRenew: false,
      },
      { actor: 'zhaochunxu' },
    );
    assert.equal(loadConfig().users[0].name, '家庭账号');
    assert.equal(loadConfig().users[0].entry_type, '六环内');
    assert.equal(loadConfig().users[0].auto_renew, false);

    const extended = extendDashboardMembership(
      '1',
      { membershipTerm: '1y' },
      { actor: 'zhaochunxu' },
    );
    assert.equal(extended.expiresOn, '2028-08-09');

    await assert.rejects(
      reloginDashboardAccount(
        '1',
        { password: 'wrong-secret' },
        {
          actor: 'zhaochunxu',
          loginFn: async () => { throw new Error('密码错误'); },
        },
      ),
      /北京通登录失败：密码错误/,
    );
    assert.equal(loadConfig().users[0].auth, 'first-token');
    assert.equal(Object.hasOwn(loadConfig().users[0], 'bjt_pwd'), false);

    await reloginDashboardAccount(
      '1',
      { password: 'next-secret' },
      { actor: 'zhaochunxu', loginFn: async () => 'second-token' },
    );
    assert.equal(loadConfig().users[0].auth, 'second-token');
    assert.equal(Object.hasOwn(loadConfig().users[0], 'bjt_pwd'), false);
    assert.doesNotMatch(
      readFileSync(join(configDir, 'config.json'), 'utf8'),
      /initial-secret|next-secret|first-token|second-token/,
    );

    assert.throws(
      () => removeDashboardAccount('2', { actor: 'zhaochunxu' }),
      /账号不存在/,
    );
    assert.deepEqual(
      removeDashboardAccount('1', { actor: 'zhaochunxu' }),
      { removed: true },
    );
    assert.equal(loadConfig()?.users?.length ?? 0, 0);

    const auditText = JSON.stringify(readAuditEvents({ since: '1d', limit: 50 }));
    assert.doesNotMatch(auditText, /initial-secret|wrong-secret|next-secret|first-token|second-token/);
    assert.match(auditText, /zhaochunxu/);
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard rejects a concurrent renewal for the same account', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-lock-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const user = {
    name: '互斥账号',
    auth: 'test-token',
    bjt_phone: '13800000008',
    membership_permanent: true,
  };
  try {
    saveConfig({ users: [user] });
    const release = acquireRenewalLock(user);
    try {
      await assert.rejects(
        runDashboardRenewal('1', { licenseNumber: '京A12345' }),
        (error) => error?.statusCode === 409 && /正在执行/.test(error.message),
      );
    } finally {
      release();
    }
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard validates account choices and falls back to the phone as its name', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-add-validation-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const validCredentials = {
    phone: '13800000001',
    password: 'initial-secret',
  };
  const loginFn = async () => 'test-token';

  try {
    await assert.rejects(
      addDashboardAccount(
        { ...validCredentials, tripProfileMode: 'default' },
        { loginFn },
      ),
      /请选择服务有效期/,
    );
    await assert.rejects(
      addDashboardAccount(
        { ...validCredentials, membershipTerm: '1y' },
        { loginFn },
      ),
      /请选择使用系统默认或自定义出行配置/,
    );
    await assert.rejects(
      addDashboardAccount(
        {
          ...validCredentials,
          membershipTerm: '1y',
          tripProfileMode: 'custom',
        },
        { loginFn },
      ),
      /在京地址不能为空/,
    );
    assert.equal(loadConfig()?.users?.length ?? 0, 0);

    const created = await addDashboardAccount(
      {
        ...validCredentials,
        membershipTerm: '1y',
        tripProfileMode: 'default',
      },
      { loginFn },
    );
    assert.equal(created.name, validCredentials.phone);
    assert.equal(loadConfig().users[0].name, validCredentials.phone);
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dashboard blocks actual renewal for an expired membership', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-web-expired-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    saveConfig({
      users: [{
        name: '到期账号',
        auth: 'test-token',
        bjt_phone: '13800000009',
        membership_started_on: '2025-01-01',
        membership_expires_on: '2026-01-01',
        membership_permanent: false,
      }],
    });
    await assert.rejects(
      runDashboardRenewal(
        '1',
        { licenseNumber: '京A12345' },
        { actor: 'zhaoyue' },
      ),
      /服务有效期已到期/,
    );
    const events = readAuditEvents({ since: '1d', limit: 10 });
    assert.equal(events.at(-1).event, 'renewal_skipped');
    assert.equal(events.at(-1).reason, 'membership_expired');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});
