const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const LEGACY_MEMBERSHIP_STARTED_ON = '2026-08-09';
export const LEGACY_MEMBERSHIP_EXPIRES_ON = '2027-08-09';
export const MEMBERSHIP_REMINDER_DAYS = new Set([30, 7, 1, 0]);

export function formatBeijingDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function parseDateOnly(value) {
  if (!DATE_PATTERN.test(String(value || ''))) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isDateOnly(value) {
  return Boolean(parseDateOnly(value));
}

export function addCalendarMonths(value, months) {
  const date = parseDateOnly(value);
  if (!date) throw new Error('日期格式应为 YYYY-MM-DD');
  const targetMonth = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0))
    .getUTCDate();
  const result = new Date(Date.UTC(
    targetYear,
    normalizedMonth,
    Math.min(date.getUTCDate(), lastDay),
  ));
  return result.toISOString().slice(0, 10);
}

function differenceInDays(left, right) {
  return Math.round(
    (parseDateOnly(left).getTime() - parseDateOnly(right).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}

export function getMembershipInfo(user, now = new Date()) {
  const today = formatBeijingDate(now);
  const permanent = user?.membership_permanent === true;
  if (permanent) {
    return {
      active: true,
      expiresOn: null,
      permanent: true,
      remainingDays: null,
      startedOn: user?.membership_started_on || null,
      status: 'permanent',
    };
  }

  const expiresOn = isDateOnly(user?.membership_expires_on)
    ? user.membership_expires_on
    : null;
  const remainingDays = expiresOn
    ? differenceInDays(expiresOn, today)
    : -1;
  const active = remainingDays >= 0;
  return {
    active,
    expiresOn,
    permanent: false,
    remainingDays,
    startedOn: isDateOnly(user?.membership_started_on)
      ? user.membership_started_on
      : null,
    status: !active
      ? 'expired'
      : remainingDays <= 30
        ? 'expiring_soon'
        : 'active',
  };
}

export function createMembership(input = {}, now = new Date()) {
  const today = formatBeijingDate(now);
  const term = input.membershipTerm || '1y';
  if (term === 'permanent') {
    return {
      membership_started_on: today,
      membership_expires_on: null,
      membership_permanent: true,
    };
  }
  const termMonths = { '1m': 1, '3m': 3, '1y': 12 }[term];
  let expiresOn;
  if (term === 'custom') {
    expiresOn = String(input.membershipExpiresOn || '');
    if (!isDateOnly(expiresOn)) throw new Error('请选择有效的服务到期日');
    if (expiresOn < today) throw new Error('服务到期日不能早于今天');
  } else if (termMonths) {
    expiresOn = addCalendarMonths(today, termMonths);
  } else {
    throw new Error('不支持的服务有效期');
  }
  return {
    membership_started_on: today,
    membership_expires_on: expiresOn,
    membership_permanent: false,
  };
}

export function extendMembership(user, input = {}, now = new Date()) {
  const today = formatBeijingDate(now);
  const term = input.membershipTerm || '1y';
  if (term === 'permanent') {
    return {
      membership_started_on: user.membership_started_on || today,
      membership_expires_on: null,
      membership_permanent: true,
    };
  }

  if (term === 'custom') {
    const expiresOn = String(input.membershipExpiresOn || '');
    if (!isDateOnly(expiresOn)) throw new Error('请选择有效的服务到期日');
    if (expiresOn < today) throw new Error('服务到期日不能早于今天');
    return {
      membership_started_on: user.membership_started_on || today,
      membership_expires_on: expiresOn,
      membership_permanent: false,
    };
  }

  const termMonths = { '1m': 1, '3m': 3, '1y': 12 }[term];
  if (!termMonths) throw new Error('不支持的服务有效期');
  const current = getMembershipInfo(user, now);
  const base = current.active && current.expiresOn
    ? current.expiresOn
    : today;
  return {
    membership_started_on: user.membership_started_on || today,
    membership_expires_on: addCalendarMonths(base, termMonths),
    membership_permanent: false,
  };
}

export function migrateMembershipConfig(config) {
  if (!Array.isArray(config?.users)) return { changed: false, config };
  let changed = false;
  const users = config.users.map((user) => {
    if (
      user.membership_permanent === true ||
      (isDateOnly(user.membership_started_on) &&
        isDateOnly(user.membership_expires_on))
    ) {
      return user;
    }
    changed = true;
    return {
      ...user,
      membership_started_on: LEGACY_MEMBERSHIP_STARTED_ON,
      membership_expires_on: LEGACY_MEMBERSHIP_EXPIRES_ON,
      membership_permanent: false,
    };
  });
  return { changed, config: changed ? { ...config, users } : config };
}
