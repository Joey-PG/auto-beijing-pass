import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { applyPermit } from '../src/commands/run.js';
import { saveConfig } from '../src/lib/config-manager.js';
import { buildApplyPayload } from '../src/lib/models.js';
import { createTripProfile } from '../src/lib/trip-profile.js';

function createRenewalApi(onSubmit) {
  let submitted = false;
  return {
    loadHomePageData: async () => ({
      state: {
        bzclxx: [{
          hphm: '京A00001',
          hpzl: '02',
          cllx: '01',
          sycs: 8,
          syts: 20,
          bzxx: submitted ? [{
            applyId: 'new-application',
            blzt: '0',
            blztmc: '审核中',
            sqsj: '2026-08-09 12:00:00',
          }] : [],
        }],
      },
    }),
    listVehicles: async () => [{
      hphm: '京A00001',
      hpzl: '02',
      cllx: '01',
      vId: 'vehicle-1',
    }],
    getUserInfo: async () => ({
      jsrxm: '测试用户',
      jszh: '110101199001011234',
    }),
    submitApply: async (payload) => {
      submitted = true;
      onSubmit(payload);
    },
  };
}

test('builds an apply payload from the confirmed trip profile', () => {
  const payload = buildApplyPayload(
    {
      licenseNumber: '京A00001',
      licensePlateType: '02',
      vehicleType: '01',
      vehicleId: 'vehicle-1',
    },
    {
      name: '测试用户',
      idNumber: '110101199001011234',
    },
    '2026-08-03',
    '六环外',
    {
      is_in_beijing: true,
      current_location: {
        longitude: '117.08',
        latitude: '40.14',
      },
      in_beijing_address: {
        address: '天润香墅湾',
        longitude: '117.08',
        latitude: '40.14',
      },
      destination: {
        address: '天润香墅湾',
        longitude: '117.08',
        latitude: '40.14',
        area: '平谷区',
        district_code: '014',
      },
      purpose: {
        name: '其它',
        code: '06',
      },
    },
  );

  assert.equal(payload.sfzj, 1);
  assert.equal(payload.zjxxdz, '天润香墅湾');
  assert.equal(payload.xxdz, '天润香墅湾');
  assert.equal(payload.jjdzgdjd, '117.08');
  assert.equal(payload.jjdzgdwd, '40.14');
  assert.equal(payload.area, '平谷区');
  assert.equal(payload.jjdq, '014');
  assert.equal(payload.jjzzl, '02');
  assert.doesNotMatch(JSON.stringify(payload), /北京动物园/);
});

test('refuses to build a production payload without a trip profile', () => {
  assert.throws(
    () =>
      buildApplyPayload(
        {},
        {},
        '2026-08-03',
        '六环外',
        null,
      ),
    /未配置出行地址/,
  );
});

test('manual renewal accepts a one-time trip profile without saving it', async () => {
  let submittedPayload = null;
  const tripProfile = createTripProfile({
    inBeijingAddress: '本次在京地址',
    inBeijingLongitude: '116.40',
    inBeijingLatitude: '39.90',
    destinationAddress: '本次进京目的地',
    destinationLongitude: '116.41',
    destinationLatitude: '39.91',
    destinationArea: '朝阳区',
    districtCode: '001',
    purposeName: '其它',
    purposeCode: '06',
  });
  const api = createRenewalApi((payload) => {
    submittedPayload = payload;
  });

  const result = await applyPermit(
    api,
    { entry_type: '六环外' },
    '京A00001',
    undefined,
    { tripProfile },
  );

  assert.equal(result.applied, true);
  assert.equal(result.confirmed, true);
  assert.match(result.message, /已提交并查询到最新状态/);
  assert.equal(submittedPayload.zjxxdz, '本次在京地址');
  assert.equal(submittedPayload.xxdz, '本次进京目的地');
});

test('default-mode renewal reads the latest administrator-managed profile', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-run-default-trip-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  let submittedPayload = null;

  try {
    saveConfig({
      default_trip_profile: createTripProfile({
        inBeijingAddress: '管理员最新在京地址',
        inBeijingLongitude: '116.42',
        inBeijingLatitude: '39.92',
        destinationAddress: '管理员最新进京目的地',
        destinationLongitude: '116.43',
        destinationLatitude: '39.93',
        destinationArea: '朝阳区',
        districtCode: '003',
        purposeName: '其它',
        purposeCode: '06',
      }),
      users: [],
    });
    const api = createRenewalApi((payload) => {
      submittedPayload = payload;
    });

    await applyPermit(
      api,
      { entry_type: '六环外', trip_profile_mode: 'default' },
      '京A00001',
    );

    assert.equal(submittedPayload.zjxxdz, '管理员最新在京地址');
    assert.equal(submittedPayload.xxdz, '管理员最新进京目的地');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});
