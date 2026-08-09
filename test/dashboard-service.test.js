import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { loadConfig, saveConfig } from '../src/lib/config-manager.js';
import {
  readAuditEvents,
  writeAuditEvent,
} from '../src/lib/audit-logger.js';
import {
  addDashboardAccount,
  getDashboard,
  getDashboardAudit,
  reloginDashboardAccount,
  removeDashboardAccount,
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

    const dashboard = await getDashboard();
    const audit = getDashboardAudit({ since: '30d' });

    assert.equal(dashboard.summary.accountCount, 1);
    assert.equal(dashboard.summary.vehicleCount, 1);
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
        entryType: '六环外',
        autoRenew: false,
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
      bjt_pwd: 'initial-secret',
      entry_type: '六环外',
      notify_urls: [],
      preferred_vehicle: '',
      auto_renew: false,
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
    assert.equal(loadConfig().users[0].bjt_pwd, 'initial-secret');

    await reloginDashboardAccount(
      '1',
      { password: 'next-secret' },
      { actor: 'zhaochunxu', loginFn: async () => 'second-token' },
    );
    assert.equal(loadConfig().users[0].auth, 'second-token');
    assert.equal(loadConfig().users[0].bjt_pwd, 'next-secret');

    assert.throws(
      () => removeDashboardAccount('2', { actor: 'zhaochunxu' }),
      /账号不存在/,
    );
    assert.deepEqual(
      removeDashboardAccount('1', { actor: 'zhaochunxu' }),
      { removed: true },
    );
    assert.equal(loadConfig().users.length, 0);

    const auditText = JSON.stringify(readAuditEvents({ since: '1d', limit: 50 }));
    assert.doesNotMatch(auditText, /initial-secret|wrong-secret|next-secret|first-token|second-token/);
    assert.match(auditText, /zhaochunxu/);
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});
