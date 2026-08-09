import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Command } from 'commander';

import {
  acquireCronLock,
  describeCronSchedule,
  getCatchUpCronSchedules,
  getRandomCronLines,
  getRandomTriggerDecision,
  getRandomWindowCronSchedules,
  registerCronCommand,
} from '../src/commands/cron.js';
import { saveConfig } from '../src/lib/config-manager.js';

const TEST_TRIP_PROFILE = {
  is_in_beijing: true,
  current_location: { longitude: '116.40', latitude: '39.90' },
  in_beijing_address: {
    address: '测试在京地址',
    longitude: '116.40',
    latitude: '39.90',
  },
  destination: {
    address: '测试目的地',
    longitude: '116.41',
    latitude: '39.91',
    area: '朝阳区',
    district_code: '001',
  },
  purpose: { name: '其它', code: '06' },
};

test('random window generates cron ticks only inside the configured hours', () => {
  assert.deepEqual(
    getRandomWindowCronSchedules('07:30-08:30'),
    ['30-59 7 * * *', '0-30 8 * * *'],
  );
  assert.deepEqual(
    getRandomWindowCronSchedules('08:15-08:45'),
    ['15-45 8 * * *'],
  );
});

test('random window rejects invalid or reversed ranges', () => {
  assert.throws(
    () => getRandomWindowCronSchedules('8:00-10:00'),
    /格式无效/,
  );
  assert.throws(
    () => getRandomWindowCronSchedules('10:00-08:00'),
    /结束时间不能早于开始时间/,
  );
});

test('each day independently selects one minute and never repeats', () => {
  const start = new Date(2026, 6, 30, 7, 30);
  const end = new Date(2026, 6, 30, 8, 30);
  const afterWindow = new Date(2026, 6, 30, 9, 0);

  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      start,
      null,
      () => 0,
    ).shouldRun,
    true,
  );
  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      start,
      null,
      () => 0.99,
    ).shouldRun,
    false,
  );
  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      end,
      null,
      () => 0.99,
    ).shouldRun,
    true,
  );
  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      end,
      '2026-07-30',
    ).reason,
    'already-ran',
  );
  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      afterWindow,
      null,
      Math.random,
      { catchUp: true },
    ).reason,
    'missed-window',
  );
  assert.equal(
    getRandomTriggerDecision(
      '07:30-08:30',
      afterWindow,
      '2026-07-30',
      Math.random,
      { catchUp: true },
    ).reason,
    'already-ran',
  );
});

test('random schedule description explains daily per-account behavior', () => {
  assert.equal(
    describeCronSchedule('30-59 7 * * *', '07:30-08:30'),
    '每个账号每天在 07:30-08:30 内各自随机一次（失败重试，错过窗口会补执行）',
  );
});

test('cloud cron checks after reboot for a missed execution', () => {
  const lines = getRandomCronLines(
    '/usr/local/bin/auto-bj-pass',
    '07:30-08:30',
    '/usr/local/bin:/usr/bin:/bin',
  );
  assert.equal(lines.length, 5);
  assert.match(lines[0], /^30-59 7 \* \* \*/);
  assert.match(lines[1], /^0-30 8 \* \* \*/);
  assert.match(lines[2], /^31-59 8 \* \* \*/);
  assert.match(lines[2], /--catch-up/);
  assert.match(lines[3], /^0-0 9 \* \* \*/);
  assert.match(lines[3], /--catch-up/);
  assert.match(lines[4], /^@reboot /);
  assert.match(lines[4], /--catch-up/);
  assert.match(lines[4], /TZ=Asia\/Shanghai/);
});

test('adds a 30-minute catch-up window after the random window', () => {
  assert.deepEqual(
    getCatchUpCronSchedules('07:30-08:30'),
    ['31-59 8 * * *', '0-0 9 * * *'],
  );
  assert.deepEqual(
    getCatchUpCronSchedules('23:30-23:59'),
    [],
  );
});

test('cron tick lock prevents concurrent scheduler processes', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-cron-lock-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    const release = acquireCronLock();
    assert.equal(typeof release, 'function');
    assert.equal(acquireCronLock(), null);
    release();

    const releaseAgain = acquireCronLock();
    assert.equal(typeof releaseAgain, 'function');
    releaseAgain();
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('cron setup refuses enabled accounts without trip profiles', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-cron-trip-'));
  const originalLog = console.log;
  const originalError = console.error;
  const messages = [];
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    saveConfig({
      users: [{
        name: '待配置账号',
        bjt_phone: '13800000001',
        auth: 'token',
        auto_renew: true,
      }],
    });
    console.log = (message) => messages.push(String(message));
    console.error = (message) => messages.push(String(message));

    const program = new Command();
    registerCronCommand(program);
    await program.parseAsync(['node', 'test', 'cron', 'setup']);

    assert.equal(process.exitCode, 1);
    assert.match(messages.join('\n'), /尚未配置完整出行信息：待配置账号/);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('failed cron execution stays retryable instead of being marked completed', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-cron-fail-'));
  const fakeBin = join(configDir, 'fake-auto-bj-pass');
  const originalLog = console.log;
  const originalError = console.error;
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  process.env.AUTO_BJ_PASS_COMMAND_NAME = fakeBin;

  try {
    writeFileSync(fakeBin, '#!/bin/sh\nexit 1\n', 'utf8');
    chmodSync(fakeBin, 0o755);
    saveConfig({
      users: [
        {
          name: '失败重试账号',
          bjt_phone: '13800000001',
          auth: 'token',
          auto_renew: true,
          trip_profile: TEST_TRIP_PROFILE,
        },
      ],
    });
    console.log = () => {};
    console.error = () => {};

    const program = new Command();
    registerCronCommand(program);
    await program.parseAsync([
      'node',
      'test',
      'cron',
      'tick',
      '--random-window',
      '00:00-00:00',
      '--catch-up',
    ]);

    const state = JSON.parse(
      readFileSync(join(configDir, 'cron-state.json'), 'utf8'),
    );
    const accountState = state.accounts['13800000001'];
    assert.equal(accountState.retryPending, true);
    assert.equal(accountState.lastRunDate, undefined);
    assert.equal(accountState.retryCount, 1);
    assert.match(accountState.nextRetryAt, /^\d{4}-\d{2}-\d{2}T/);

    accountState.nextRetryAt = new Date(0).toISOString();
    writeFileSync(
      join(configDir, 'cron-state.json'),
      JSON.stringify(state, null, 2),
      'utf8',
    );
    writeFileSync(fakeBin, '#!/bin/sh\nexit 0\n', 'utf8');
    process.exitCode = undefined;

    const retryProgram = new Command();
    registerCronCommand(retryProgram);
    await retryProgram.parseAsync([
      'node',
      'test',
      'cron',
      'tick',
      '--random-window',
      '00:00-00:00',
      '--catch-up',
    ]);

    const retriedState = JSON.parse(
      readFileSync(join(configDir, 'cron-state.json'), 'utf8'),
    ).accounts['13800000001'];
    assert.match(retriedState.lastRunDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(retriedState.retryPending, false);
    assert.equal(retriedState.retryCount, 0);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    delete process.env.AUTO_BJ_PASS_COMMAND_NAME;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('successful cron execution is marked completed for the current day', async () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-cron-ok-'));
  const fakeBin = join(configDir, 'fake-auto-bj-pass');
  const originalLog = console.log;
  const originalError = console.error;
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  process.env.AUTO_BJ_PASS_COMMAND_NAME = fakeBin;

  try {
    writeFileSync(fakeBin, '#!/bin/sh\nexit 0\n', 'utf8');
    chmodSync(fakeBin, 0o755);
    saveConfig({
      users: [
        {
          name: '成功账号',
          bjt_phone: '13800000002',
          auth: 'token',
          auto_renew: true,
          trip_profile: TEST_TRIP_PROFILE,
        },
      ],
    });
    console.log = () => {};
    console.error = () => {};

    const program = new Command();
    registerCronCommand(program);
    await program.parseAsync([
      'node',
      'test',
      'cron',
      'tick',
      '--random-window',
      '00:00-00:00',
      '--catch-up',
    ]);

    const state = JSON.parse(
      readFileSync(join(configDir, 'cron-state.json'), 'utf8'),
    );
    const accountState = state.accounts['13800000002'];
    assert.match(accountState.lastRunDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(accountState.retryPending, false);
    assert.equal(accountState.retryCount, 0);
    assert.match(accountState.completedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    delete process.env.AUTO_BJ_PASS_COMMAND_NAME;
    process.exitCode = undefined;
    rmSync(configDir, { recursive: true, force: true });
  }
});
