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
  getDashboard,
  getDashboardAudit,
  updateDashboardAccount,
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
    });

    const user = loadConfig().users[0];
    assert.equal(user.auto_renew, false);
    assert.equal(user.entry_type, '六环内');
    assert.equal(user.preferred_vehicle, '京B12345');
    assert.throws(
      () => updateDashboardAccount('1', { entryType: '不限区域' }),
      /只能是六环内或六环外/,
    );
    const audit = readAuditEvents({ since: '1d', limit: 10 });
    assert.equal(audit.length, 2);
    assert.equal(audit[0].source, 'web');
    assert.equal(audit[0].result, 'success');
    assert.equal(audit[1].source, 'web');
    assert.equal(audit[1].result, 'failure');
    assert.equal(audit[1].error, '进京证类型只能是六环内或六环外');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});
