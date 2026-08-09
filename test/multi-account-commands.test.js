import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Command } from 'commander';

import { runCommand } from '../src/commands/run.js';
import {
  formatAutoRenewText,
  formatValidityText,
  formatNextRenewTime,
  registerStatusCommand,
} from '../src/commands/status.js';
import { registerTripCommand } from '../src/commands/trip.js';
import {
  loadConfig,
  saveConfig,
} from '../src/lib/config-manager.js';

function fakeState(plate) {
  return {
    code: 200,
    data: {
      bzclxx: [
        {
          hphm: plate,
          sycs: '10',
          syts: '10',
          ybcs: 1,
          ylzsfkb: false,
          elzsfkb: false,
          bzxx: [
            {
              blztmc: '审核通过(生效中)',
              yxqs: '2099-01-01',
              yxqz: '2099-01-07',
              jjzzlmc: '进京证（六环外）',
              sqsj: '2099-01-01 08:00:00',
            },
          ],
        },
      ],
    },
  };
}

test('run processes every initialized account by default', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-run-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const output = [];
  const requests = [];

  try {
    saveConfig({
      users: [
        {
          name: '账号甲',
          auth: 'token-a',
          bjt_phone: '13800000001',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
        },
        {
          name: '账号乙',
          auth: 'token-b',
          bjt_phone: '13800000002',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
        },
        {
          name: '账号丙',
          auth: 'token-c',
          bjt_phone: '13800000003',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
          auto_renew: false,
        },
      ],
    });
    globalThis.fetch = async (url, options) => {
      const token = options.headers.Authorization;
      requests.push({ token, url });
      return {
        json: async () =>
          fakeState(token === 'token-a' ? '京A00001' : '京B00002'),
      };
    };
    console.log = (message) => output.push(String(message));

    await runCommand({ noNotify: true });

    assert.deepEqual(
      requests.map(({ token }) => token),
      [
        'token-a',
        'token-a',
        'token-a',
        'token-a',
        'token-b',
        'token-b',
        'token-b',
        'token-b',
      ],
    );
    assert.deepEqual(
      requests.slice(0, 4).map(({ url }) => new URL(url).pathname),
      [
        '/auth/userController/getLoginType',
        '/pro/configRecordController/getConfigRecordInfo',
        '/pro/applyRecordController/stateList',
        '/pro/noticeController/list',
      ],
    );
    assert.match(output.join('\n'), /\[账号甲\]/);
    assert.match(output.join('\n'), /\[账号乙\]/);
    assert.match(
      output.join('\n'),
      /\[账号丙\] 已关闭自动续签，跳过/,
    );
    assert.equal(process.exitCode, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('run blocks actual renewal after service expiry without calling JTGL', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-expired-run-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const output = [];

  try {
    saveConfig({
      users: [{
        name: '到期账号',
        auth: 'token-expired',
        bjt_phone: '13800000009',
        auto_renew: true,
        membership_started_on: '2025-01-01',
        membership_expires_on: '2026-01-01',
        membership_permanent: false,
        notify_urls: [],
      }],
    });
    globalThis.fetch = async () => {
      throw new Error('expired account must not access JTGL');
    };
    console.log = (message) => output.push(String(message));

    await runCommand({ noNotify: true });

    assert.match(output.join('\n'), /服务已于 2026-01-01 到期，跳过/);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('dry-run previews a configured trip without submitting', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-dry-run-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const output = [];
  const requestedPaths = [];

  try {
    saveConfig({
      users: [
        {
          name: '预览账号',
          auth: 'token-preview',
          bjt_phone: '13800000001',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
          auto_renew: false,
          trip_profile: {
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
            purpose: { name: '其它', code: '06' },
          },
        },
      ],
    });
    globalThis.fetch = async (url) => {
      requestedPaths.push(url);
      if (
        url.endsWith('/auth/userController/getLoginType') ||
        url.endsWith('/pro/configRecordController/getConfigRecordInfo') ||
        url.endsWith('/pro/noticeController/list')
      ) {
        return {
          json: async () => ({ code: 200, data: {} }),
        };
      }
      if (url.endsWith('/pro/applyRecordController/stateList')) {
        return { json: async () => fakeState('京A00001') };
      }
      if (url.endsWith('/pro/vehicleController/getUserIdInfo')) {
        return {
          json: async () => ({
            code: 200,
            data: [
              {
                hphm: '京A00001',
                hpzl: '02',
                cllx: '01',
                vId: 'vehicle-1',
              },
            ],
          }),
        };
      }
      if (url.endsWith('/pro/applyRecordController/getJsrxx')) {
        return {
          json: async () => ({
            code: 200,
            data: {
              jsrxm: '测试用户',
              jszh: '110101199001011234',
            },
          }),
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    };
    console.log = (message) => output.push(String(message));

    await runCommand({
      account: '预览账号',
      noNotify: true,
      dryRun: true,
    });

    const rendered = output.join('\n');
    assert.match(rendered, /DRY RUN：未提交申请/);
    assert.match(rendered, /在京地址: 天润香墅湾 \(117\.08, 40\.14\)/);
    assert.match(rendered, /进京目的地: 天润香墅湾 \(117\.08, 40\.14\)/);
    assert.match(rendered, /目的地区县: 平谷区 \(014\)/);
    assert.equal(
      requestedPaths.some((url) => url.includes('insertApplyRecord')),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('trip set updates the in-Beijing address without changing the destination', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-trip-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalLog = console.log;

  try {
    saveConfig({
      users: [
        {
          name: '地址账号',
          auth: 'token-trip',
          bjt_phone: '13800000001',
          trip_profile: {
            is_in_beijing: true,
            current_location: {
              longitude: '117.073374',
              latitude: '40.144339',
            },
            in_beijing_address: {
              address: '天润香墅湾一号地东区',
              longitude: '117.073374',
              latitude: '40.144339',
            },
            destination: {
              address: '天润香墅湾一号地东区',
              longitude: '117.073374',
              latitude: '40.144339',
              area: '平谷区',
              district_code: '014',
            },
            purpose: { name: '其它', code: '06' },
          },
        },
      ],
    });
    console.log = () => {};

    const program = new Command();
    registerTripCommand(program);
    await program.parseAsync([
      'node',
      'test',
      'trip',
      'set',
      '--account',
      '地址账号',
      '--in-beijing-address',
      '莲花潭多功能大厅',
      '--in-beijing-longitude',
      '117.063396',
      '--in-beijing-latitude',
      '40.184350',
    ]);

    const [user] = loadConfig().users;
    assert.deepEqual(user.trip_profile.current_location, {
      longitude: '117.063396',
      latitude: '40.184350',
    });
    assert.deepEqual(user.trip_profile.in_beijing_address, {
      address: '莲花潭多功能大厅',
      longitude: '117.063396',
      latitude: '40.184350',
    });
    assert.deepEqual(user.trip_profile.destination, {
      address: '天润香墅湾一号地东区',
      longitude: '117.073374',
      latitude: '40.144339',
      area: '平谷区',
      district_code: '014',
    });
  } finally {
    console.log = originalLog;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('status always displays each account auto-renew state', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-status-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const output = [];

  try {
    saveConfig({
      users: [
        {
          name: '开启账号',
          auth: 'token-on',
          bjt_phone: '13800000001',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
          auto_renew: true,
          trip_profile: {
            is_in_beijing: true,
            current_location: {
              longitude: '117.063396',
              latitude: '40.184350',
            },
            in_beijing_address: {
              address: '莲花潭村',
              longitude: '117.063396',
              latitude: '40.184350',
            },
            destination: {
              address: '莲花潭村',
              longitude: '117.063396',
              latitude: '40.184350',
              area: '平谷区',
              district_code: '014',
            },
            purpose: { name: '其它', code: '06' },
          },
        },
        {
          name: '关闭账号',
          auth: 'token-off',
          bjt_phone: '13800000002',
          bjt_pwd: '',
          entry_type: '六环外',
          notify_urls: [],
          auto_renew: false,
        },
      ],
    });
    globalThis.fetch = async (_url, options) => ({
      json: async () =>
        fakeState(
          options.headers.Authorization === 'token-on'
            ? '京A00001'
            : '京B00002',
        ),
    });
    console.log = (message) => output.push(String(message));

    const program = new Command();
    registerStatusCommand(program);
    await program.parseAsync(['node', 'test', 'status']);

    const rendered = output.join('\n');
    assert.match(
      rendered,
      /\[开启账号\] 进京证状态[\s\S]*自动续签: 已开启（[^）]+）/,
    );
    assert.doesNotMatch(rendered, /续签状态: 当前无需续签/);
    assert.match(
      rendered,
      /\[关闭账号\] 进京证状态[\s\S]*自动续签: 已关闭/,
    );
    assert.match(
      rendered,
      /在京地址: 莲花潭村 \(117\.063396, 40\.184350\)/,
    );
    assert.match(
      rendered,
      /进京目的地: 莲花潭村 \(117\.063396, 40\.184350\)/,
    );
    assert.match(
      rendered,
      /\[关闭账号\][\s\S]*在京地址（默认）: 王辛庄镇放光村村委会 \(117\.082463, 40\.180804\)/,
    );
    assert.match(
      rendered,
      /\[关闭账号\][\s\S]*进京目的地（默认）: 王辛庄镇放光村村委会 \(117\.082463, 40\.180804\)/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('auto-renew status stays concise and next-renew time is separate', () => {
  assert.equal(
    formatAutoRenewText(
      true,
      {
        active: true,
        schedule: '30 8 * * *',
        description: '每天 08:30',
        dailyTime: '08:30',
      },
    ),
    '已开启',
  );
  assert.equal(
    formatAutoRenewText(
      true,
      { active: false, schedule: null, description: null },
    ),
    '已开启（未设置定时任务）',
  );
  assert.equal(
    formatNextRenewTime(
      {
        active: true,
        description: '每个账号每天随机一次',
        dailyTime: null,
        randomWindow: '07:30-08:30',
      },
      '2026-08-02',
    ),
    '2026-08-02 07:30-08:30 内随机',
  );
  assert.equal(
    formatNextRenewTime(
      {
        active: true,
        description: '每天 08:30',
        dailyTime: '08:30',
        randomWindow: null,
      },
      '2026-08-02',
    ),
    '2026-08-02 08:30',
  );
});

test('pending permit displays its validity length instead of counting today', () => {
  const record = {
    statusName: '审核通过(待生效)',
    validFrom: '2026-08-01',
    validTo: '2026-08-07',
  };

  assert.equal(
    formatValidityText(
      record,
      record.validTo,
      new Date(2026, 6, 31, 9, 43),
    ),
    '2026-08-01 至 2026-08-07（有效期 7 天，明天生效）',
  );
});

test('active permit continues to display inclusive remaining days', () => {
  const record = {
    statusName: '审核通过(生效中)',
    validFrom: '2026-07-31',
    validTo: '2026-08-06',
  };

  assert.equal(
    formatValidityText(
      record,
      record.validTo,
      new Date(2026, 6, 31, 9, 43),
    ),
    '2026-07-31 至 2026-08-06（剩余 7 天）',
  );
});
