import { execFileSync, execSync } from 'node:child_process';
import {
  chmodSync,
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { output, success, error } from '../output.js';
import {
  ensureCronLog,
  getCronLogPath,
  sanitizeLogText,
  writeAuditEvent,
} from '../lib/audit-logger.js';
import {
  ensureConfigDir,
  getAccountLabel,
  getConfigDir,
  getUsers,
} from '../lib/config-manager.js';
import {
  getMembershipInfo,
  MEMBERSHIP_REMINDER_DAYS,
} from '../lib/membership.js';
import { notify } from '../lib/notifier.js';
import { isCompleteTripProfile } from '../lib/trip-profile.js';

const COMMAND_NAME =
  process.env.AUTO_BJ_PASS_COMMAND_NAME ||
  process.env.CROSS_BJ_COMMAND_NAME ||
  'auto-bj-pass';
const MARKER = `# ${COMMAND_NAME} auto renewal`;
const LEGACY_MARKERS = [
  '# cross-bj-next auto renewal',
  '# cross-bj auto renewal',
];
const STATE_FILE = 'cron-state.json';
const LOCK_FILE = 'cron-tick.lock';
const LOCK_STALE_MS = 15 * 60 * 1000;
const RETRY_DELAY_MS = 5 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 15 * 60 * 1000;
const RETRY_JITTER_RATIO = 0.2;
export const RETRY_GRACE_MINUTES = 30;
export const DEFAULT_RANDOM_WINDOW = '07:30-08:30';

function getRuntimePath() {
  return [
    dirname(process.execPath),
    join(homedir(), '.local', 'bin'),
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ].join(':');
}

function getCurrentCrontab() {
  try {
    return execSync('crontab -l', { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

export function getDailyScheduleTime(schedule) {
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 5) {
    return null;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  const isDaily =
    dayOfMonth === '*' && month === '*' && dayOfWeek === '*';
  const numericMinute = Number(minute);
  const numericHour = Number(hour);
  const hasValidTime =
    /^\d+$/.test(minute) &&
    /^\d+$/.test(hour) &&
    numericMinute >= 0 &&
    numericMinute <= 59 &&
    numericHour >= 0 &&
    numericHour <= 23;

  if (isDaily && hasValidTime) {
    return (
      `${String(numericHour).padStart(2, '0')}:` +
      String(numericMinute).padStart(2, '0')
    );
  }

  return null;
}

function parseRandomWindow(randomWindow) {
  const match = randomWindow.match(
    /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/,
  );
  if (!match) {
    throw new Error(
      '随机时间段格式无效，请使用 HH:MM-HH:MM（如 08:00-10:00）',
    );
  }

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = Number(match[3]) * 60 + Number(match[4]);
  if (endMinutes < startMinutes) {
    throw new Error('随机时间段的结束时间不能早于开始时间');
  }

  return {
    startMinutes,
    endMinutes,
  };
}

export function getRandomWindowCronSchedules(randomWindow) {
  const { startMinutes, endMinutes } =
    parseRandomWindow(randomWindow);
  const startHour = Math.floor(startMinutes / 60);
  const startMinute = startMinutes % 60;
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;

  if (startHour === endHour) {
    const minutes =
      startMinute === 0 && endMinute === 59
        ? '*'
        : `${startMinute}-${endMinute}`;
    return [`${minutes} ${startHour} * * *`];
  }

  const schedules = [
    `${startMinute === 0 ? '*' : `${startMinute}-59`} ${startHour} * * *`,
  ];
  if (endHour - startHour > 1) {
    schedules.push(`* ${startHour + 1}-${endHour - 1} * * *`);
  }
  schedules.push(
    `${endMinute === 59 ? '*' : `0-${endMinute}`} ${endHour} * * *`,
  );
  return schedules;
}

function formatMinutes(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return (
    `${String(hour).padStart(2, '0')}:` +
    String(minute).padStart(2, '0')
  );
}

function getPlannedAt(date, plannedMinute) {
  const [year, month, day] = date.split('-').map(Number);
  const hour = Math.floor(plannedMinute / 60);
  const minute = plannedMinute % 60;
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

export function getRetryDelayMs(retryCount, random = Math.random) {
  const attempt = Math.max(1, Number(retryCount) || 1);
  const exponentialDelay = Math.min(
    RETRY_DELAY_MS * 2 ** (attempt - 1),
    MAX_RETRY_DELAY_MS,
  );
  const jitter =
    1 - RETRY_JITTER_RATIO + random() * RETRY_JITTER_RATIO * 2;
  return Math.min(
    MAX_RETRY_DELAY_MS,
    Math.round(exponentialDelay * jitter),
  );
}

export function getCatchUpCronSchedules(
  randomWindow,
  graceMinutes = RETRY_GRACE_MINUTES,
) {
  const { endMinutes } = parseRandomWindow(randomWindow);
  const startMinutes = endMinutes + 1;
  if (startMinutes >= 24 * 60 || graceMinutes <= 0) {
    return [];
  }
  const retryEndMinutes = Math.min(
    endMinutes + graceMinutes,
    24 * 60 - 1,
  );
  return getRandomWindowCronSchedules(
    `${formatMinutes(startMinutes)}-${formatMinutes(retryEndMinutes)}`,
  );
}

function getScheduleFromCronLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('@')) {
    return trimmed.split(/\s+/, 1)[0];
  }
  return trimmed.split(/\s+/).slice(0, 5).join(' ');
}

export function getRandomCronLines(
  binPath,
  randomWindow,
  runtimePath = getRuntimePath(),
) {
  const logPath = getCronLogPath();
  const command =
    `env TZ=Asia/Shanghai AUTO_BJ_PASS_RUN_SOURCE=cron_tick ` +
    `PATH=${runtimePath} ${binPath} ` +
    `cron tick --random-window ${randomWindow}`;
  const marker = `${MARKER} random-window=${randomWindow}`;
  return [
    ...getRandomWindowCronSchedules(randomWindow).map(
      (schedule) =>
        `${schedule} ${command} >> ${logPath} 2>&1 ${marker}`,
    ),
    ...getCatchUpCronSchedules(randomWindow).map(
      (schedule) =>
        `${schedule} ${command} --catch-up >> ${logPath} 2>&1 ${marker}`,
    ),
    `@reboot ${command} --catch-up >> ${logPath} 2>&1 ${marker}`,
  ];
}

function formatLocalDate(date) {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    String(date.getDate()).padStart(2, '0')
  );
}

export function getRandomTriggerDecision(
  randomWindow,
  now,
  lastRunDate = null,
  random = Math.random,
  { catchUp = false, plannedMinute = null } = {},
) {
  const { startMinutes, endMinutes } =
    parseRandomWindow(randomWindow);
  const date = formatLocalDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const plannedMinuteIsValid =
    Number.isInteger(plannedMinute) &&
    plannedMinute >= startMinutes &&
    plannedMinute <= endMinutes;
  const selectedMinute = plannedMinuteIsValid
    ? plannedMinute
    : Math.min(
        endMinutes,
        startMinutes +
          Math.floor(random() * (endMinutes - startMinutes + 1)),
      );
  const plan = {
    plannedAt: getPlannedAt(date, selectedMinute),
    plannedMinute: selectedMinute,
    plannedTime: formatMinutes(selectedMinute),
  };

  if (lastRunDate === date) {
    return { shouldRun: false, date, reason: 'already-ran', ...plan };
  }
  if (currentMinutes < startMinutes) {
    return { shouldRun: false, date, reason: 'outside-window', ...plan };
  }
  if (currentMinutes > endMinutes) {
    return catchUp
      ? {
          shouldRun: true,
          date,
          reason: 'missed-window',
          remainingMinutes: 0,
          ...plan,
        }
      : { shouldRun: false, date, reason: 'outside-window', ...plan };
  }

  const remainingMinutes = Math.max(0, selectedMinute - currentMinutes);
  const shouldRun = currentMinutes >= selectedMinute;
  return {
    shouldRun,
    date,
    reason: shouldRun ? 'selected' : 'not-selected',
    remainingMinutes,
    ...plan,
  };
}

export function describeCronSchedule(schedule, randomWindow = null) {
  if (randomWindow) {
    return (
      `每个账号每天在 ${randomWindow} 内各自随机一次` +
      '（失败退避重试，错过窗口会补执行）'
    );
  }
  const dailyTime = getDailyScheduleTime(schedule);
  if (!dailyTime) {
    return `cron ${schedule}`;
  }
  return `每天 ${dailyTime}`;
}

export function getCronScheduleInfo() {
  const current = getCurrentCrontab();
  const lines = current
    .split('\n')
    .filter((item) =>
      [MARKER, ...LEGACY_MARKERS].some((marker) =>
        item.includes(marker),
      ),
    );

  if (lines.length === 0) {
    return {
      active: false,
      schedule: null,
      schedules: [],
      description: null,
      dailyTime: null,
      randomWindow: null,
    };
  }

  const line = lines[0];
  const schedule = getScheduleFromCronLine(line);
  const randomWindow =
    line.match(/\brandom-window=(\S+)/)?.[1] || null;
  return {
    active: true,
    schedule,
    schedules: lines.map(getScheduleFromCronLine),
    description: describeCronSchedule(schedule, randomWindow),
    dailyTime: randomWindow ? null : getDailyScheduleTime(schedule),
    randomWindow,
    catchUpEnabled: lines.some((item) =>
      item.trimStart().startsWith('@reboot '),
    ),
  };
}

function getCronStatePath() {
  return join(getConfigDir(), STATE_FILE);
}

export function loadCronState() {
  const path = getCronStatePath();
  if (!existsSync(path)) {
    return { accounts: {} };
  }
  try {
    const state = JSON.parse(readFileSync(path, 'utf-8'));
    return {
      ...state,
      accounts:
        state.accounts && typeof state.accounts === 'object'
          ? state.accounts
          : {},
    };
  } catch {
    return { accounts: {} };
  }
}

function saveCronState(state) {
  ensureConfigDir();
  const path = getCronStatePath();
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8');
  chmodSync(path, 0o600);
}

export function getCronRuntimeInfo(
  schedule,
  users = getUsers({ initializedOnly: true }),
  now = new Date(),
) {
  const state = loadCronState();
  const date = formatLocalDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const accounts = users.map((user, index) => {
    const accountKey = user.bjt_phone || user.name || String(index + 1);
    const accountState = state.accounts[accountKey] || {};
    const disabled = user.auto_renew === false;
    const expired = !getMembershipInfo(user, now).active;
    const completed = accountState.lastRunDate === date;
    const retrying =
      accountState.retryPending === true &&
      accountState.lastAttemptDate === date;
    const plannedToday = accountState.plannedDate === date;
    const overdue =
      !disabled &&
      !expired &&
      !completed &&
      !retrying &&
      plannedToday &&
      Number.isInteger(accountState.plannedMinute) &&
      currentMinutes > accountState.plannedMinute;
    let status = 'pending';
    if (expired) status = 'expired';
    else if (disabled) status = 'disabled';
    else if (completed) status = 'completed';
    else if (retrying) status = 'retrying';
    else if (overdue) status = 'overdue';
    else if (plannedToday) status = 'scheduled';

    return {
      id: String(index + 1),
      name: user.name?.trim() || `账号 ${index + 1}`,
      status,
      plannedAt: plannedToday ? accountState.plannedAt || null : null,
      plannedTime: plannedToday ? accountState.plannedTime || null : null,
      completedAt: completed ? accountState.completedAt || null : null,
      lastAttemptAt: accountState.lastAttemptAt || null,
      lastError: retrying ? accountState.lastError || null : null,
      nextRetryAt: retrying ? accountState.nextRetryAt || null : null,
      retryCount: retrying ? Number(accountState.retryCount || 0) : 0,
    };
  });
  const counts = accounts.reduce(
    (result, account) => {
      result.total += 1;
      result[account.status] += 1;
      if (!['disabled', 'expired'].includes(account.status)) result.eligible += 1;
      return result;
    },
    {
      completed: 0,
      disabled: 0,
      eligible: 0,
      expired: 0,
      overdue: 0,
      pending: 0,
      retrying: 0,
      scheduled: 0,
      total: 0,
    },
  );

  let health = schedule?.active ? 'healthy' : 'inactive';
  let healthMessage = schedule?.active
    ? '调度计划已安装'
    : '尚未安装自动调度计划';
  if (schedule?.active && schedule.randomWindow) {
    const { startMinutes, endMinutes } = parseRandomWindow(
      schedule.randomWindow,
    );
    const monitoringWindow =
      currentMinutes >= startMinutes &&
      currentMinutes <= endMinutes + RETRY_GRACE_MINUTES;
    const lastTickAt = state.lastTickAt
      ? new Date(state.lastTickAt)
      : null;
    const heartbeatStale =
      !lastTickAt ||
      Number.isNaN(lastTickAt.getTime()) ||
      now.getTime() - lastTickAt.getTime() > 4 * 60 * 1000;
    const heartbeatMissingToday =
      currentMinutes >= startMinutes &&
      (!lastTickAt ||
        Number.isNaN(lastTickAt.getTime()) ||
        formatLocalDate(lastTickAt) !== date);
    if (heartbeatMissingToday) {
      health = 'warning';
      healthMessage = '今天尚未收到调度心跳';
    } else if (monitoringWindow && heartbeatStale) {
      health = 'warning';
      healthMessage = '执行窗口内未收到最新调度心跳';
    } else if (state.lastTickResult === 'failure') {
      health = 'warning';
      healthMessage = '最近一次调度轮询执行失败';
    } else if (counts.retrying > 0 || counts.overdue > 0) {
      health = 'warning';
      healthMessage = counts.retrying > 0
        ? `${counts.retrying} 个账号正在等待重试`
        : `${counts.overdue} 个账号已超过计划时间`;
    }
  }

  return {
    accounts,
    counts,
    health,
    healthMessage,
    lastTickAt: state.lastTickAt || null,
    lastTickCompletedAt: state.lastTickCompletedAt || null,
    lastTickResult: state.lastTickResult || null,
  };
}

function getCronLockPath() {
  return join(getConfigDir(), LOCK_FILE);
}

export function acquireCronLock(
  now = new Date(),
  staleMs = LOCK_STALE_MS,
) {
  ensureConfigDir();
  const path = getCronLockPath();
  const token = randomUUID();

  function createLock() {
    let descriptor;
    try {
      descriptor = openSync(path, 'wx', 0o600);
      writeFileSync(
        descriptor,
        JSON.stringify({
          token,
          pid: process.pid,
          createdAt: now.toISOString(),
        }),
        'utf8',
      );
    } finally {
      if (descriptor !== undefined) {
        closeSync(descriptor);
      }
    }
  }

  try {
    createLock();
  } catch (err) {
    if (err?.code !== 'EEXIST') throw err;
    let isStale = false;
    try {
      isStale = now.getTime() - statSync(path).mtimeMs > staleMs;
    } catch (statError) {
      if (statError?.code !== 'ENOENT') throw statError;
    }
    if (!isStale) return null;
    try {
      unlinkSync(path);
    } catch (unlinkError) {
      if (unlinkError?.code !== 'ENOENT') return null;
    }
    try {
      createLock();
    } catch {
      return null;
    }
  }

  return () => {
    try {
      const lock = JSON.parse(readFileSync(path, 'utf8'));
      if (lock.token === token) {
        unlinkSync(path);
      }
    } catch {
      // The lock may already have been recovered or removed.
    }
  };
}

function getBinPath() {
  const commandName =
    process.env.AUTO_BJ_PASS_COMMAND_NAME ||
    process.env.CROSS_BJ_COMMAND_NAME ||
    'auto-bj-pass';
  try {
    return execSync(`which ${commandName}`, { encoding: 'utf-8' }).trim();
  } catch {
    return commandName;
  }
}

export function registerCronCommand(program) {
  const cron = program.command('cron').description('定时任务管理');

  cron
    .command('setup')
    .description('设置自动续签定时任务（默认每天在 07:30-08:30 随机）')
    .option('--schedule <cron>', '使用固定 cron 表达式（如 "0 8 * * *"）')
    .option(
      '--random-window <range>',
      '随机选择每日执行时间段（HH:MM-HH:MM）',
      DEFAULT_RANDOM_WINDOW,
    )
    .action(async (options) => {
      try {
        const missingProfiles = getUsers({ initializedOnly: true })
          .filter(
            (user) =>
              user.auto_renew !== false &&
              !isCompleteTripProfile(user.trip_profile),
          )
          .map((user, index) => getAccountLabel(user, index));
        if (missingProfiles.length > 0) {
          throw new Error(
            `以下自动续签账号尚未配置完整出行信息：${missingProfiles.join('、')}`,
          );
        }
        ensureCronLog();
        let current = getCurrentCrontab();

        // 如果已存在，先移除旧的再写入新的
        current = current
          .split('\n')
          .filter((line) =>
            ![MARKER, ...LEGACY_MARKERS].some((marker) =>
              line.includes(marker),
            ),
          )
          .join('\n');

        const binPath = getBinPath();
        const randomWindow = options.schedule
          ? null
          : options.randomWindow;
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (randomWindow && timeZone !== 'Asia/Shanghai') {
          throw new Error(
            '服务器时区必须为 Asia/Shanghai；请先运行 ' +
            '`sudo timedatectl set-timezone Asia/Shanghai`',
          );
        }
        const schedules = options.schedule
          ? [options.schedule]
          : [
              ...getRandomWindowCronSchedules(randomWindow),
              ...getCatchUpCronSchedules(randomWindow),
            ];
        const cronLines = randomWindow
          ? getRandomCronLines(binPath, randomWindow)
          : [
              `${options.schedule} env TZ=Asia/Shanghai ` +
              'AUTO_BJ_PASS_RUN_SOURCE=cron ' +
              `PATH=${getRuntimePath()} ${binPath} run ` +
              `>> ${getCronLogPath()} 2>&1 ${MARKER}`,
            ];
        const newCrontab =
          current.trimEnd() +
          (current.trim() ? '\n' : '') +
          cronLines.join('\n') +
          '\n';
        const escapedCrontab = newCrontab.replace(/'/g, "'\\''");

        execSync(`printf '%s' '${escapedCrontab}' | crontab -`, { encoding: 'utf-8' });
        writeAuditEvent('cron_configured', {
          result: 'success',
          random_window: randomWindow,
          schedules,
          catch_up_enabled: Boolean(randomWindow),
        });
        const description = describeCronSchedule(
          schedules[0],
          randomWindow,
        );
        output(
          success(
            {
              schedule: schedules[0],
              schedules,
              dailyTime: null,
              randomWindow,
              timeZone,
              catchUpEnabled: Boolean(randomWindow),
              commands: cronLines,
            },
            `定时任务已设置: ${description}`,
          ),
        );
      } catch (err) {
        writeAuditEvent(
          'cron_configuration_failed',
          { result: 'failure', error: err.message },
          { level: 'error' },
        );
        output(error(`设置定时任务失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  cron
    .command('tick', { hidden: true })
    .option(
      '--random-window <range>',
      '每日随机执行时间段',
      DEFAULT_RANDOM_WINDOW,
    )
    .option('--catch-up', '错过当天时间段时立即补执行')
    .action(async (options) => {
      let releaseLock = null;
      let state = null;
      try {
        releaseLock = acquireCronLock();
        if (!releaseLock) {
          writeAuditEvent('cron_tick_skipped', {
            result: 'skipped',
            reason: 'another_tick_is_running',
            random_window: options.randomWindow,
          });
          return;
        }

        const now = new Date();
        state = loadCronState();
        state.lastTickAt = now.toISOString();
        state.lastTickResult = 'running';
        saveCronState(state);
        const users = getUsers({ initializedOnly: true });
        const selectedAccounts = [];
        let eligibleCount = 0;
        let disabledCount = 0;
        let expiredCount = 0;
        let missingProfileCount = 0;

        for (const [index, user] of users.entries()) {
          const accountKey =
            user.bjt_phone || user.name || String(index + 1);
          const previous = state.accounts[accountKey] || {};
          const membership = getMembershipInfo(user, now);
          const reminderDate = formatLocalDate(now);
          if (
            MEMBERSHIP_REMINDER_DAYS.has(membership.remainingDays) &&
            (previous.membershipReminderDate !== reminderDate ||
              previous.membershipReminderDays !== membership.remainingDays)
          ) {
            const label = getAccountLabel(user, index);
            const reminderMessage = membership.remainingDays === 0
              ? `服务有效期今天到期（${membership.expiresOn}），明天起将停止自动续签。`
              : `服务有效期还剩 ${membership.remainingDays} 天，将于 ${membership.expiresOn} 到期。`;
            if (user.notify_urls?.length > 0) {
              await notify(
                user.notify_urls,
                `[${label}] 服务有效期提醒`,
                reminderMessage,
              );
            }
            writeAuditEvent('membership_expiry_reminder', {
              account: label,
              result: 'success',
              membership_expires_on: membership.expiresOn,
              remaining_days: membership.remainingDays,
              notification_configured: user.notify_urls?.length > 0,
            });
            previous.membershipReminderDate = reminderDate;
            previous.membershipReminderDays = membership.remainingDays;
            state.accounts[accountKey] = previous;
          }
          if (!membership.active) {
            expiredCount += 1;
            state.accounts[accountKey] = {
              ...previous,
              membershipExpiredAuditDate: reminderDate,
              lastError: null,
              nextRetryAt: null,
              retryPending: false,
              retryCount: 0,
            };
            if (previous.membershipExpiredAuditDate !== reminderDate) {
              writeAuditEvent('renewal_skipped', {
                account: getAccountLabel(user, index),
                result: 'skipped',
                reason: 'membership_expired',
                membership_expires_on: membership.expiresOn,
                source: 'cron_tick',
              });
            }
            continue;
          }
          if (user.auto_renew === false) {
            disabledCount += 1;
            continue;
          }
          if (!isCompleteTripProfile(user.trip_profile)) {
            missingProfileCount += 1;
            writeAuditEvent('cron_account_skipped', {
              account: getAccountLabel(user, index),
              result: 'skipped',
              reason: 'missing_trip_profile',
            });
            continue;
          }
          eligibleCount += 1;
          const plannedMinute =
            previous.plannedDate === formatLocalDate(now) &&
            previous.randomWindow === options.randomWindow
              ? previous.plannedMinute
              : null;
          let decision = getRandomTriggerDecision(
            options.randomWindow,
            now,
            previous?.lastRunDate,
            Math.random,
            { catchUp: options.catchUp, plannedMinute },
          );
          const accountState = {
            ...previous,
            plannedAt: decision.plannedAt,
            plannedDate: decision.date,
            plannedMinute: decision.plannedMinute,
            plannedTime: decision.plannedTime,
            randomWindow: options.randomWindow,
          };
          state.accounts[accountKey] = accountState;
          const nextRetryAt = previous?.nextRetryAt
            ? new Date(previous.nextRetryAt)
            : null;
          const hasPendingRetry =
            previous?.retryPending === true &&
            previous?.lastAttemptDate === decision.date;
          const retryIsBlocked =
            hasPendingRetry &&
            nextRetryAt &&
            !Number.isNaN(nextRetryAt.getTime()) &&
            nextRetryAt > now;
          if (retryIsBlocked) {
            continue;
          }
          const retryIsDue =
            hasPendingRetry &&
            (!nextRetryAt ||
              Number.isNaN(nextRetryAt.getTime()) ||
              nextRetryAt <= now);
          if (retryIsDue && decision.reason !== 'already-ran') {
            decision = {
              ...decision,
              shouldRun: true,
              reason: 'retry',
            };
          }
          if (!decision.shouldRun) {
            continue;
          }

          const triggeredAt = now.toISOString();
          const selector =
            user.bjt_phone || user.name || String(index + 1);
          selectedAccounts.push({
            user,
            index,
            selector,
            triggeredAt,
            accountKey,
            decision,
            previous: accountState,
          });
          writeAuditEvent('cron_account_selected', {
            account: getAccountLabel(user, index),
            result: 'selected',
            reason: decision.reason,
            triggered_at: triggeredAt,
            random_window: options.randomWindow,
          });
        }

        let succeededCount = 0;
        let failedCount = 0;
        for (const {
          user,
          index,
          selector,
          triggeredAt,
          accountKey,
          decision,
          previous,
        } of selectedAccounts) {
          const label = getAccountLabel(user, index);
          try {
            output(
              success(
                {
                  account: label,
                  triggeredAt,
                  randomWindow: options.randomWindow,
                },
                `[${label}] 命中今日随机续签时间`,
              ),
            );
            execFileSync(
              getBinPath(),
              ['run', '--account', selector],
              {
                stdio: 'inherit',
                env: {
                  ...process.env,
                  AUTO_BJ_PASS_RUN_SOURCE: options.catchUp
                    ? 'cron_catch_up'
                    : 'cron',
                  AUTO_BJ_PASS_RUN_ID:
                    process.env.AUTO_BJ_PASS_RUN_ID ||
                    process.env.CROSS_BJ_RUN_ID ||
                    triggeredAt,
                },
              },
            );
            const completedAt = new Date().toISOString();
            state.accounts[accountKey] = {
              ...previous,
              lastRunDate: decision.date,
              triggeredAt,
              completedAt,
              lastAttemptAt: triggeredAt,
              lastAttemptDate: decision.date,
              lastError: null,
              nextRetryAt: null,
              retryPending: false,
              retryCount: 0,
            };
            saveCronState(state);
            succeededCount += 1;
            writeAuditEvent('cron_account_completed', {
              account: label,
              result: 'success',
              triggered_at: triggeredAt,
              completed_at: completedAt,
              random_window: options.randomWindow,
            });
          } catch (err) {
            const failedAt = new Date();
            const retryCount =
              previous?.lastAttemptDate === decision.date
                ? Number(previous.retryCount || 0) + 1
                : 1;
            state.accounts[accountKey] = {
              ...previous,
              lastAttemptDate: decision.date,
              lastAttemptAt: failedAt.toISOString(),
              lastError: sanitizeLogText(
                err.message || '自动续签执行失败',
              ),
              retryPending: true,
              retryCount,
              nextRetryAt: new Date(
                failedAt.getTime() + getRetryDelayMs(retryCount),
              ).toISOString(),
            };
            saveCronState(state);
            failedCount += 1;
            writeAuditEvent(
              'cron_account_failed',
              {
                account: label,
                result: 'failure',
                error: err.message,
                retry_count: retryCount,
                next_retry_at: state.accounts[accountKey].nextRetryAt,
              },
              { level: 'error' },
            );
            output(error(`[${label}] 自动续签执行失败: ${err.message}`));
            process.exitCode = 1;
          }
        }
        state.lastTickCompletedAt = new Date().toISOString();
        state.lastTickResult = failedCount > 0
          ? 'partial_failure'
          : 'success';
        state.lastTickError = null;
        saveCronState(state);
        writeAuditEvent(
          'cron_tick_completed',
          {
            result: failedCount > 0 ? 'partial_failure' : 'success',
            eligible_count: eligibleCount,
            disabled_count: disabledCount,
            expired_count: expiredCount,
            missing_profile_count: missingProfileCount,
            selected_count: selectedAccounts.length,
            succeeded_count: succeededCount,
            failed_count: failedCount,
            random_window: options.randomWindow,
            catch_up: Boolean(options.catchUp),
          },
          { level: failedCount > 0 ? 'warning' : 'info' },
        );
      } catch (err) {
        if (state) {
          state.lastTickCompletedAt = new Date().toISOString();
          state.lastTickResult = 'failure';
          state.lastTickError = sanitizeLogText(
            err.message || '随机定时任务执行失败',
          );
          saveCronState(state);
        }
        writeAuditEvent(
          'cron_tick_failed',
          { result: 'failure', error: err.message },
          { level: 'error' },
        );
        output(error(`随机定时任务执行失败: ${err.message}`));
        process.exitCode = 1;
      } finally {
        releaseLock?.();
      }
    });

  cron
    .command('remove')
    .description('移除自动续签定时任务')
    .action(async () => {
      try {
        const current = getCurrentCrontab();

        const managedMarkers = [MARKER, ...LEGACY_MARKERS];
        if (!managedMarkers.some((marker) => current.includes(marker))) {
          output(success(null, `未找到 ${COMMAND_NAME} 定时任务`));
          return;
        }

        const filtered = current
          .split('\n')
          .filter((line) =>
            !managedMarkers.some((marker) => line.includes(marker)),
          )
          .join('\n');

        const escapedCrontab = filtered.replace(/'/g, "'\\''");
        execSync(`printf '%s' '${escapedCrontab}' | crontab -`, { encoding: 'utf-8' });
        writeAuditEvent('cron_removed', { result: 'success' });
        output(success(null, '定时任务已移除'));
      } catch (err) {
        writeAuditEvent(
          'cron_removal_failed',
          { result: 'failure', error: err.message },
          { level: 'error' },
        );
        output(error(`移除定时任务失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  cron
    .command('status')
    .description('查看定时任务状态')
    .action(async () => {
      try {
        const scheduleInfo = getCronScheduleInfo();

        if (scheduleInfo.active) {
          output(
            success(
              scheduleInfo,
              `定时任务已启用: ${scheduleInfo.description}`,
            ),
          );
        } else {
          output(success({ active: false }, '定时任务未设置'));
        }
      } catch (err) {
        output(error(`查询定时任务状态失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
