import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  ensureCronLog,
  getAuditOutcome,
  getAppLogPath,
  getAuditLogPath,
  getLogDir,
  queryAuditEvents,
  readAuditEvents,
  writeAppLog,
  writeAuditEvent,
} from '../src/lib/audit-logger.js';

test('writes persistent logs with restrictive permissions and masks secrets', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-audit-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const date = new Date('2026-07-30T08:00:00.000Z');

  try {
    writeAppLog(
      'info',
      '账号 13901224105 车牌 津G835S0\n' +
        '在京地址: 王辛庄镇放光村村委会\n' +
        '发动机号: ABC123\n' +
        '通知: bark://private-key',
      {},
      date,
    );
    writeAuditEvent(
      'renewal_skipped',
      {
        account: '13901224105',
        phone: '13901224105',
        plate: '津G835S0',
        auth: 'private-token',
        auth_encrypted: 'encrypted-private-token',
        bjt_pwd_encrypted: 'encrypted-private-password',
        address: '王辛庄镇放光村村委会',
        result: 'success',
        reason: 'not_due',
      },
      { date, runId: 'test-run' },
    );
    ensureCronLog();

    const appLog = readFileSync(getAppLogPath(date), 'utf8');
    const auditLog = readFileSync(getAuditLogPath(date), 'utf8');
    assert.doesNotMatch(
      appLog,
      /13901224105|津G835S0|放光村|ABC123|private-key/,
    );
    assert.match(appLog, /139\*{4}4105/);
    assert.match(appLog, /津G\*{5}/);
    assert.match(auditLog, /13901224105/);
    assert.match(auditLog, /津G835S0/);
    assert.doesNotMatch(
      auditLog,
      /private-token|encrypted-private-token|encrypted-private-password|放光村/,
    );
    assert.equal(statSync(getLogDir()).mode & 0o777, 0o700);
    assert.equal(statSync(getAppLogPath(date)).mode & 0o777, 0o600);
    assert.equal(statSync(getAuditLogPath(date)).mode & 0o777, 0o600);
    assert.equal(statSync(join(getLogDir(), 'cron.log')).mode & 0o777, 0o600);
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('queries audit events by time, account and event', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-audit-query-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    writeAuditEvent(
      'renewal_skipped',
      {
        account: '13901224105',
        result: 'success',
        reason: 'not_due',
      },
      {
        date: new Date('2026-07-29T08:00:00.000Z'),
        runId: 'run-1',
      },
    );
    writeAuditEvent(
      'renewal_submitted',
      {
        account: '18710125935',
        result: 'success',
      },
      {
        date: new Date('2026-07-30T08:00:00.000Z'),
        runId: 'run-2',
      },
    );

    const rows = readAuditEvents({
      since: '2026-07-28',
      account: '13901224105',
      event: 'renewal_skipped',
      now: new Date('2026-07-31T00:00:00.000Z'),
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].account, '13901224105');
    assert.equal(rows[0].event, 'renewal_skipped');
    assert.equal(rows[0].run_id, 'run-1');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('classifies outcomes and paginates audit events newest first', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-audit-page-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    const entries = [
      ['renewal_check_started', 'started'],
      ['cron_tick_skipped', 'skipped'],
      ['notification_tested', 'partial_failure'],
      ['renewal_failed', 'failure'],
      ['renewal_submitted', 'success'],
    ];
    entries.forEach(([event, result], index) => {
      writeAuditEvent(
        event,
        { result, source: 'web' },
        {
          date: new Date(`2026-07-30T08:0${index}:00.000Z`),
          level: result === 'failure' ? 'error' : 'info',
          runId: `run-${index}`,
        },
      );
    });

    const firstPage = queryAuditEvents({
      since: '2026-07-01',
      page: 1,
      pageSize: 2,
      now: new Date('2026-07-31T00:00:00.000Z'),
    });
    const failures = queryAuditEvents({
      since: '2026-07-01',
      status: 'failure',
      now: new Date('2026-07-31T00:00:00.000Z'),
    });
    const renewalResults = queryAuditEvents({
      events: ['renewal_failed', 'renewal_submitted'],
      since: '2026-07-01',
      now: new Date('2026-07-31T00:00:00.000Z'),
    });

    assert.equal(firstPage.total, 5);
    assert.deepEqual(
      firstPage.items.map((item) => item.event),
      ['renewal_submitted', 'renewal_failed'],
    );
    assert.equal(firstPage.items[0].source, 'web');
    assert.equal(firstPage.items[0].actor, null);
    assert.equal(failures.total, 1);
    assert.deepEqual(
      renewalResults.items.map((item) => item.event),
      ['renewal_submitted', 'renewal_failed'],
    );
    assert.equal(getAuditOutcome({ result: 'partial_failure' }), 'partial_failure');
    assert.equal(getAuditOutcome({ result: 'skipped' }), 'skipped');
    assert.equal(getAuditOutcome({ result: 'selected' }), 'in_progress');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});
