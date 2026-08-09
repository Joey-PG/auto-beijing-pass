import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { getConfigDir } from './config-manager.js';

const LOG_DIR_NAME = 'logs';

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDateParts(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
  };
}

function localIsoTimestamp(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset =
    `${sign}${pad(Math.floor(absoluteOffset / 60))}:` +
    pad(absoluteOffset % 60);
  const { year, month, day } = localDateParts(date);
  return (
    `${year}-${month}-${day}T` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}.` +
    `${String(date.getMilliseconds()).padStart(3, '0')}${offset}`
  );
}

export function getLogDir() {
  return join(getConfigDir(), LOG_DIR_NAME);
}

export function getCronLogPath() {
  return join(getLogDir(), 'cron.log');
}

export function getAppLogPath(date = new Date()) {
  const { year, month, day } = localDateParts(date);
  return join(getLogDir(), `app-${year}-${month}-${day}.log`);
}

export function getAuditLogPath(date = new Date()) {
  const { year, month } = localDateParts(date);
  return join(getLogDir(), `audit-${year}-${month}.jsonl`);
}

export function ensureLogDir() {
  const dir = getLogDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  chmodSync(dir, 0o700);
  return dir;
}

export function ensureCronLog() {
  const path = getCronLogPath();
  ensureLogDir();
  appendFileSync(path, '', { encoding: 'utf8', mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

export function maskPhone(value) {
  return String(value || '').replace(
    /(^|[^\d])(\d{3})\d{4}(\d{4})(?!\d)/g,
    '$1$2****$3',
  );
}

export function maskPlate(value) {
  return String(value || '').replace(
    /([京津冀晋蒙辽吉黑沪苏浙皖闽赣鲁豫鄂湘粤桂琼渝川贵云藏陕甘青宁新使领警学港澳][A-Z])[A-Z0-9]{5,6}/g,
    '$1*****',
  );
}

export function sanitizeLogText(value) {
  return maskPlate(maskPhone(String(value ?? '')))
    .replace(
      /(^|\D)\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[0-9Xx](?!\d)/g,
      '$1[身份证已脱敏]',
    )
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, '[通知地址已脱敏]')
    .replace(
      /^(在京地址(?:（默认）)?|进京目的地(?:（默认）)?|当前申请位置):.*$/gm,
      '$1: [地址已脱敏]',
    )
    .replace(/^(\s*发动机号):.*$/gm, '$1: [已脱敏]');
}

function sanitizeAuditValue(
  value,
  key = '',
  { maskIdentifiers = true } = {},
) {
  if (value === null || value === undefined) return value;
  if (
    /^(auth|token|password|bjt_pwd)(?:_encrypted)?$|^(secret|notify_urls?|url|payload|address|location|longitude|latitude)$/i.test(
      key,
    )
  ) {
    return '[已脱敏]';
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeAuditValue(item, '', { maskIdentifiers }),
    );
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeAuditValue(childValue, childKey, { maskIdentifiers }),
      ]),
    );
  }
  if (/phone|mobile|account/i.test(key)) {
    return maskIdentifiers ? maskPhone(value) : String(value);
  }
  if (/plate|hphm/i.test(key)) {
    return maskIdentifiers ? maskPlate(value) : String(value);
  }
  return typeof value === 'string' ? sanitizeLogText(value) : value;
}

function appendSecure(path, content) {
  ensureLogDir();
  appendFileSync(path, content, { encoding: 'utf8', mode: 0o600 });
  chmodSync(path, 0o600);
}

export function writeAppLog(
  level,
  message,
  fields = {},
  date = new Date(),
) {
  try {
    const safeMessage = sanitizeLogText(message).replace(/\s*\n\s*/g, ' | ');
    const safeFields = sanitizeAuditValue(fields);
    const suffix =
      Object.keys(safeFields).length > 0
        ? ` ${JSON.stringify(safeFields)}`
        : '';
    appendSecure(
      getAppLogPath(date),
      `${localIsoTimestamp(date)} ${String(level).toUpperCase()} ${safeMessage}${suffix}\n`,
    );
  } catch {
    // Logging must never block permit operations.
  }
}

export function writeAuditEvent(
  event,
  fields = {},
  { level = 'info', date = new Date(), runId = null } = {},
) {
  const {
    actor: fieldActor,
    source: fieldSource,
    ...safeFields
  } = sanitizeAuditValue(fields, '', { maskIdentifiers: false });
  const source =
    fieldSource ||
    process.env.AUTO_BJ_PASS_RUN_SOURCE ||
    process.env.CROSS_BJ_RUN_SOURCE ||
    'manual';
  const entry = {
    ...safeFields,
    timestamp: localIsoTimestamp(date),
    level,
    event,
    run_id:
      runId ||
      process.env.AUTO_BJ_PASS_RUN_ID ||
      process.env.CROSS_BJ_RUN_ID ||
      randomUUID(),
    source,
    actor:
      fieldActor ||
      process.env.AUTO_BJ_PASS_RUN_ACTOR ||
      process.env.CROSS_BJ_RUN_ACTOR ||
      (source === 'manual'
        ? process.env.SUDO_USER || process.env.USER || null
        : null),
    version:
      process.env.AUTO_BJ_PASS_VERSION ||
      process.env.CROSS_BJ_VERSION ||
      null,
  };
  try {
    appendSecure(getAuditLogPath(date), `${JSON.stringify(entry)}\n`);
  } catch {
    // Logging must never block permit operations.
  }
  return entry;
}

export function getAuditOutcome(row = {}) {
  if (row.level === 'error' || row.result === 'failure') return 'failure';
  if (row.result === 'partial_failure') return 'partial_failure';
  if (row.result === 'skipped') return 'skipped';
  if (row.result === 'started' || row.result === 'selected') return 'in_progress';
  return 'success';
}

function parseSince(value, now = new Date()) {
  if (!value) {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  const days = String(value).match(/^(\d+)d$/i);
  if (days) {
    return new Date(
      now.getTime() - Number(days[1]) * 24 * 60 * 60 * 1000,
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('时间格式无效，请使用 7d 或 YYYY-MM-DD');
  }
  return parsed;
}

export function readAuditEvents({
  since = '30d',
  account = null,
  event = null,
  events = null,
  limit = 100,
  now = new Date(),
} = {}) {
  const dir = getLogDir();
  if (!existsSync(dir)) return [];
  const sinceDate = parseSince(since, now);
  const accountFilters = account
    ? new Set([String(account), maskPhone(account)])
    : null;
  const eventFilters = events?.length
    ? new Set(events.map(String))
    : event
      ? new Set([String(event)])
      : null;
  const files = readdirSync(dir)
    .filter((name) => /^audit-\d{4}-\d{2}\.jsonl$/.test(name))
    .sort();
  const rows = [];
  for (const file of files) {
    const lines = readFileSync(join(dir, file), 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (new Date(row.timestamp) < sinceDate) continue;
        if (eventFilters && !eventFilters.has(row.event)) continue;
        if (
          accountFilters &&
          ![...accountFilters].some((candidate) =>
            String(row.account || '').includes(candidate),
          )
        ) {
          continue;
        }
        rows.push(row);
      } catch {
        // Ignore a partial final line or a manually damaged record.
      }
    }
  }
  return rows
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    .slice(-Math.max(1, Number(limit) || 100));
}

export function queryAuditEvents({
  since = '30d',
  account = null,
  event = null,
  events = null,
  status = null,
  page = 1,
  pageSize = 20,
  now = new Date(),
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const rows = readAuditEvents({
    since,
    account,
    event,
    events,
    limit: Number.MAX_SAFE_INTEGER,
    now,
  })
    .filter((row) => !status || getAuditOutcome(row) === status)
    .reverse();
  const start = (safePage - 1) * safePageSize;
  return {
    items: rows.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: rows.length,
  };
}

export function formatAuditEvent(row) {
  const details = [
    row.account ? `账号=${row.account}` : null,
    row.result ? `结果=${row.result}` : null,
    row.reason ? `原因=${row.reason}` : null,
    row.valid_to ? `有效期至=${row.valid_to}` : null,
    row.next_run ? `下次=${row.next_run}` : null,
  ].filter(Boolean);
  return (
    `${row.timestamp} [${row.level}] ${row.event}` +
    (details.length ? ` ${details.join(' ')}` : '')
  );
}
