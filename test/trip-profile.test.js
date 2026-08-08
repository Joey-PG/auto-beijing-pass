import assert from 'node:assert/strict';
import test from 'node:test';

import { buildApplyPayload } from '../src/lib/models.js';

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
