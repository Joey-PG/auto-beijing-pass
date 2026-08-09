import { getCronScheduleInfo } from '../commands/cron.js';
import { applyPermit } from '../commands/run.js';
import { API_BASE_URL } from '../constants.js';
import { ApiManager } from '../lib/api-manager.js';
import { login } from '../lib/bjt-login.js';
import {
  getAccountLabel,
  getUsers,
  removeUser,
  resolveUser,
  updateUser,
  upsertUser,
} from '../lib/config-manager.js';
import {
  maskPlate,
  maskPhone,
  queryAuditEvents,
  readAuditEvents,
  writeAuditEvent,
} from '../lib/audit-logger.js';
import {
  parseStateData,
  parseVehicle,
  vehicleToApiDict,
} from '../lib/models.js';
import { resolveTripProfile } from '../lib/trip-profile.js';
import {
  createMembership,
  extendMembership,
  getMembershipInfo,
} from '../lib/membership.js';

const ENTRY_TYPES = new Set(['六环内', '六环外']);
const PLATE_TYPES = new Set(['01', '02', '06', '13', '51', '52']);
const VEHICLE_TYPES = new Set(['01', '02']);
const PHONE_PATTERN = /^1\d{10}$/;
const MAX_ACCOUNT_NAME_LENGTH = 40;
const MAX_PASSWORD_LENGTH = 256;

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function writeWebFailure(
  event,
  error,
  { actor = null, user = null, ...fields } = {},
) {
  writeAuditEvent(
    event,
    {
      ...fields,
      account: user ? getAccountLabel(user) : null,
      actor,
      error: getErrorMessage(error),
      result: 'failure',
      source: 'web',
    },
    { level: 'error' },
  );
}

function getAccountById(accountId) {
  if (accountId === undefined || accountId === null || accountId === '') {
    throw new WebServiceError('必须指定账号', 400);
  }
  const users = getUsers({ initializedOnly: true });
  let user;
  try {
    user = resolveUser(users, accountId);
  } catch {
    throw new WebServiceError('账号不存在或尚未完成初始化', 404);
  }
  if (!user) {
    throw new WebServiceError('账号不存在或尚未完成初始化', 404);
  }
  return { user, users };
}

function createApi(user) {
  return new ApiManager(API_BASE_URL, user.auth);
}

function getDashboardAccountName(user, index) {
  return user?.name?.trim() || String(user?.bjt_phone || '') || `账号${index + 1}`;
}

function validateAccountName(value, fallback = '') {
  const name = String(value || '').trim() || fallback;
  if (!name) throw new WebServiceError('账号名称不能为空', 400);
  if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    throw new WebServiceError(`账号名称不能超过 ${MAX_ACCOUNT_NAME_LENGTH} 个字符`, 400);
  }
  return name;
}

function validatePhone(value) {
  const phone = String(value || '').trim();
  if (!PHONE_PATTERN.test(phone)) {
    throw new WebServiceError('请输入有效的 11 位北京通手机号', 400);
  }
  return phone;
}

function validatePassword(value) {
  const password = String(value || '');
  if (!password) throw new WebServiceError('北京通密码不能为空', 400);
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new WebServiceError('北京通密码长度不正确', 400);
  }
  return password;
}

function validateEntryType(value, fallback = '六环外') {
  const entryType = value || fallback;
  if (!ENTRY_TYPES.has(entryType)) {
    throw new WebServiceError('进京证类型只能是六环内或六环外', 400);
  }
  return entryType;
}

function maskEngine(value) {
  const text = String(value || '');
  if (text.length <= 2) return text;
  return `${'•'.repeat(Math.max(2, text.length - 2))}${text.slice(-2)}`;
}

function normalizeRecords(stateVehicle) {
  const records = [
    ...(stateVehicle?.records || []),
    ...(stateVehicle?.secondaryRecords || []),
  ];
  const unique = new Map();
  for (const record of records) {
    const key = record.applyId || [
      record.applyTime,
      record.validFrom,
      record.validTo,
      record.statusCode,
    ].join('|');
    unique.set(key, record);
  }
  return [...unique.values()].sort((left, right) =>
    String(right.applyTime || right.validFrom).localeCompare(
      String(left.applyTime || left.validFrom),
    ),
  );
}

function mergeVehicle(fullVehicle, stateVehicle, user, account) {
  return {
    accountId: account.id,
    accountName: account.name,
    vehicleId: fullVehicle?.vehicleId || stateVehicle?.vId || '',
    licenseNumber:
      fullVehicle?.licenseNumber || stateVehicle?.licenseNumber || '',
    licensePlateType:
      fullVehicle?.licensePlateType || stateVehicle?.licensePlateType || '',
    licensePlateTypeName: fullVehicle?.licensePlateTypeName || '',
    vehicleType: fullVehicle?.vehicleType || stateVehicle?.vehicleType || '',
    vehicleTypeName: fullVehicle?.vehicleTypeName || '',
    engineNumber: maskEngine(fullVehicle?.engineNumber),
    brand: fullVehicle?.brand || '',
    registrationDate: fullVehicle?.registrationDate || '',
    preferred:
      user.preferred_vehicle ===
      (fullVehicle?.licenseNumber || stateVehicle?.licenseNumber),
    usedTimes: stateVehicle?.usedTimes ?? 0,
    totalDays: stateVehicle?.totalDays ?? 0,
    availableDays: stateVehicle?.availableDays ?? 0,
    remainingTimes: stateVehicle?.remainingTimes ?? '',
    remainingDays: stateVehicle?.remainingDays ?? '',
    cannotApplyReason: stateVehicle?.cannotApplyReason || '',
    records: normalizeRecords(stateVehicle),
  };
}

async function loadAccountDashboard(user, index) {
  const api = createApi(user);
  const membership = getMembershipInfo(user);
  const account = {
    id: String(index + 1),
    name: getDashboardAccountName(user, index),
    phone: String(user.bjt_phone || ''),
    entryType: user.entry_type || '六环外',
    autoRenew: user.auto_renew !== false,
    preferredVehicle: user.preferred_vehicle || '',
    tripProfile: resolveTripProfile(user.trip_profile),
    membershipStartedOn: membership.startedOn,
    membershipExpiresOn: membership.expiresOn,
    membershipPermanent: membership.permanent,
    membershipRemainingDays: membership.remainingDays,
    membershipStatus: membership.status,
  };

  try {
    const [rawVehicles, homePage] = await Promise.all([
      api.listVehicles(),
      api.loadHomePageData(),
    ]);
    const fullVehicles = rawVehicles.map(parseVehicle);
    const stateVehicles = parseStateData(homePage.state).vehicles;
    const plates = new Set([
      ...fullVehicles.map((vehicle) => vehicle.licenseNumber),
      ...stateVehicles.map((vehicle) => vehicle.licenseNumber),
    ]);
    const vehicles = [...plates].map((plate) =>
      mergeVehicle(
        fullVehicles.find((vehicle) => vehicle.licenseNumber === plate),
        stateVehicles.find((vehicle) => vehicle.licenseNumber === plate),
        user,
        account,
      ),
    );
    return { ...account, vehicles, error: null };
  } catch (error) {
    return {
      ...account,
      vehicles: [],
      error: error instanceof Error ? error.message : '读取账号失败',
    };
  }
}

export async function getDashboard() {
  const users = getUsers({ initializedOnly: true });
  const accounts = await Promise.all(
    users.map((user, index) => loadAccountDashboard(user, index)),
  );
  const auditEvents = readAuditEvents({ since: '30d', limit: 500 }).reverse();
  for (const account of accounts) {
    const auditAccountNames = new Set(
      [account.name, account.phone, maskPhone(account.name), maskPhone(account.phone)]
        .filter(Boolean),
    );
    for (const vehicle of account.vehicles) {
      const maskedPlate = maskPlate(vehicle.licenseNumber);
      const lastExecution = auditEvents.find(
        (event) =>
          auditAccountNames.has(event.account) &&
          [vehicle.licenseNumber, maskedPlate].includes(event.plate) &&
          String(event.event || '').startsWith('renewal_'),
      );
      vehicle.lastExecution = lastExecution
        ? {
            event: lastExecution.event,
            result: lastExecution.result || lastExecution.level,
            timestamp: lastExecution.timestamp,
          }
        : null;
    }
  }
  let schedule;
  try {
    schedule = getCronScheduleInfo();
  } catch {
    schedule = { active: false, description: null, randomWindow: null };
  }
  return {
    generatedAt: new Date().toISOString(),
    schedule,
    accounts,
    summary: {
      accountCount: accounts.length,
      vehicleCount: accounts.reduce(
        (total, account) => total + account.vehicles.length,
        0,
      ),
      failedAccountCount: accounts.filter((account) => account.error).length,
    },
  };
}

export async function addDashboardAccount(
  input,
  { actor = null, loginFn = login } = {},
) {
  let phone = '';
  try {
    phone = validatePhone(input?.phone);
    const password = validatePassword(input?.password);
    const name = validateAccountName(input?.name, phone);
    const entryType = validateEntryType(input?.entryType);
    const autoRenew = input?.autoRenew ?? true;
    if (typeof autoRenew !== 'boolean') {
      throw new WebServiceError('自动续签开关必须是布尔值', 400);
    }
    if (getUsers().some((user) => user.bjt_phone === phone)) {
      throw new WebServiceError('该北京通手机号已存在，请使用重新登录', 409);
    }
    if (getUsers().some((user) => user.name?.trim() === name)) {
      throw new WebServiceError('账号名称已存在，请使用其他名称', 409);
    }

    let membership;
    try {
      membership = createMembership(input);
    } catch (error) {
      throw new WebServiceError(getErrorMessage(error), 400);
    }

    const token = await loginFn(phone, password);
    const user = {
      name,
      auth: token,
      bjt_phone: phone,
      bjt_pwd: password,
      entry_type: entryType,
      notify_urls: [],
      preferred_vehicle: '',
      auto_renew: autoRenew,
      ...membership,
    };
    const index = upsertUser(user);
    writeAuditEvent('account_initialized', {
      account: name,
      actor,
      phone,
      result: 'success',
      entry_type: entryType,
      auto_renew: autoRenew,
      membership_expires_on: membership.membership_expires_on,
      membership_permanent: membership.membership_permanent,
      source: 'web',
    });
    return { id: String(index + 1), name, phone };
  } catch (error) {
    writeWebFailure('account_initialized', error, { actor, phone });
    if (error instanceof WebServiceError) throw error;
    throw new WebServiceError(`北京通登录失败：${getErrorMessage(error)}`, 400);
  }
}

export async function reloginDashboardAccount(
  accountId,
  input,
  { actor = null, loginFn = login } = {},
) {
  let user = null;
  try {
    ({ user } = getAccountById(accountId));
    const password = validatePassword(input?.password);
    const token = await loginFn(user.bjt_phone, password);
    updateUser({ auth: token, bjt_pwd: password }, user.bjt_phone);
    writeAuditEvent('account_reauthenticated', {
      account: getAccountLabel(user),
      actor,
      phone: user.bjt_phone,
      result: 'success',
      source: 'web',
    });
    return { updated: true };
  } catch (error) {
    writeWebFailure('account_reauthenticated', error, { actor, user });
    if (error instanceof WebServiceError) throw error;
    throw new WebServiceError(`北京通登录失败：${getErrorMessage(error)}`, 400);
  }
}

export function removeDashboardAccount(accountId, { actor = null } = {}) {
  let user = null;
  try {
    ({ user } = getAccountById(accountId));
    const removed = removeUser(user.bjt_phone);
    writeAuditEvent('account_removed', {
      account: getAccountLabel(removed),
      actor,
      phone: removed.bjt_phone,
      result: 'success',
      source: 'web',
    });
    return { removed: true };
  } catch (error) {
    writeWebFailure('account_removed', error, {
      account_id: accountId,
      actor,
      user,
    });
    throw error;
  }
}

function validateVehicleInput(input) {
  const plate = String(input.licenseNumber || '').trim().toUpperCase();
  const engine = String(input.engineNumber || '').trim();
  const brand = String(input.brand || '').trim();
  const registrationDate = String(input.registrationDate || '').trim();
  const licensePlateType = String(
    input.licensePlateType || (plate.length >= 8 ? '52' : '02'),
  );
  const vehicleType = String(input.vehicleType || '01');
  if (!/^[\u4e00-\u9fa5A-Z0-9]{7,8}$/.test(plate)) {
    throw new WebServiceError('车牌格式不正确，应为 7 或 8 位', 400);
  }
  if (!engine || engine.length > 32) {
    throw new WebServiceError('请填写有效的发动机号后 6 位', 400);
  }
  if (!brand || brand.length > 64) {
    throw new WebServiceError('请填写有效的品牌型号', 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(registrationDate)) {
    throw new WebServiceError('注册日期格式应为 YYYY-MM-DD', 400);
  }
  if (!PLATE_TYPES.has(licensePlateType)) {
    throw new WebServiceError('不支持的号牌类型', 400);
  }
  if (!VEHICLE_TYPES.has(vehicleType)) {
    throw new WebServiceError('不支持的车辆类型', 400);
  }
  return {
    licenseNumber: plate,
    engineNumber: engine,
    brand,
    registrationDate,
    licensePlateType,
    vehicleType,
  };
}

export async function addDashboardVehicle(
  accountId,
  input,
  { actor = null } = {},
) {
  let user = null;
  try {
    ({ user } = getAccountById(accountId));
    const vehicle = validateVehicleInput(input);
    const api = createApi(user);
    await api.addVehicle(vehicleToApiDict(vehicle));
    const rawVehicles = await api.listVehicles();
    if (!user.preferred_vehicle && rawVehicles.length === 1) {
      updateUser({ preferred_vehicle: vehicle.licenseNumber }, user.bjt_phone);
    }
    writeAuditEvent('vehicle_added', {
      account: getAccountLabel(user),
      actor,
      result: 'success',
      plate: vehicle.licenseNumber,
      plate_type: vehicle.licensePlateType,
      vehicle_type: vehicle.vehicleType,
      source: 'web',
    });
    return { licenseNumber: vehicle.licenseNumber };
  } catch (error) {
    writeWebFailure('vehicle_added', error, {
      account_id: accountId,
      actor,
      plate: input?.licenseNumber || null,
      user,
    });
    throw error;
  }
}

export async function removeDashboardVehicle(
  accountId,
  vehicleId,
  { actor = null } = {},
) {
  let user = null;
  let vehicle = null;
  try {
    ({ user } = getAccountById(accountId));
    const api = createApi(user);
    const vehicles = (await api.listVehicles()).map(parseVehicle);
    vehicle = vehicles.find((item) => item.vehicleId === vehicleId);
    if (!vehicle) {
      throw new WebServiceError('车辆不存在或已经删除', 404);
    }
    await api.deleteVehicle(vehicleId);
    const updates = {};
    if (user.preferred_vehicle === vehicle.licenseNumber) {
      updates.preferred_vehicle = '';
    }
    if (Object.keys(updates).length > 0) {
      updateUser(updates, user.bjt_phone);
    }
    writeAuditEvent('vehicle_removed', {
      account: getAccountLabel(user),
      actor,
      result: 'success',
      plate: vehicle.licenseNumber,
      source: 'web',
    });
    return { licenseNumber: vehicle.licenseNumber };
  } catch (error) {
    writeWebFailure('vehicle_removed', error, {
      account_id: accountId,
      actor,
      plate: vehicle?.licenseNumber || null,
      user,
      vehicle_id: vehicleId,
    });
    throw error;
  }
}

export function updateDashboardAccount(
  accountId,
  input,
  { actor = null } = {},
) {
  let user = null;
  try {
    const account = getAccountById(accountId);
    ({ user } = account);
    const updates = {};
    if (Object.hasOwn(input, 'name')) {
      const name = validateAccountName(input.name);
      if (
        account.users.some(
          (candidate) => candidate !== user && candidate.name?.trim() === name,
        )
      ) {
        throw new WebServiceError('账号名称已存在，请使用其他名称', 409);
      }
      updates.name = name;
    }
    if (Object.hasOwn(input, 'autoRenew')) {
      if (typeof input.autoRenew !== 'boolean') {
        throw new WebServiceError('自动续签开关必须是布尔值', 400);
      }
      updates.auto_renew = input.autoRenew;
    }
    if (Object.hasOwn(input, 'entryType')) {
      updates.entry_type = validateEntryType(input.entryType);
    }
    if (Object.hasOwn(input, 'preferredVehicle')) {
      const preferredVehicle = String(input.preferredVehicle || '').trim();
      if (
        preferredVehicle &&
        !/^[\u4e00-\u9fa5A-Z0-9]{7,8}$/.test(preferredVehicle)
      ) {
        throw new WebServiceError('首选车牌格式不正确', 400);
      }
      updates.preferred_vehicle = preferredVehicle;
    }
    if (Object.keys(updates).length === 0) {
      throw new WebServiceError('没有可更新的配置', 400);
    }
    updateUser(updates, user.bjt_phone);
    writeAuditEvent('config_changed', {
      account: getAccountLabel(user),
      actor,
      result: 'success',
      changed_fields: Object.keys(updates),
      source: 'web',
    });
    return { updated: true };
  } catch (error) {
    writeWebFailure('config_changed', error, {
      account_id: accountId,
      actor,
      attempted_fields: Object.keys(input || {}),
      user,
    });
    throw error;
  }
}

export function extendDashboardMembership(
  accountId,
  input,
  { actor = null } = {},
) {
  let user = null;
  try {
    ({ user } = getAccountById(accountId));
    const before = getMembershipInfo(user);
    let updates;
    try {
      updates = extendMembership(user, input);
    } catch (error) {
      throw new WebServiceError(getErrorMessage(error), 400);
    }
    updateUser(updates, user.bjt_phone);
    const after = getMembershipInfo({ ...user, ...updates });
    writeAuditEvent('membership_extended', {
      account: getAccountLabel(user),
      actor,
      result: 'success',
      previous_expires_on: before.expiresOn,
      membership_expires_on: after.expiresOn,
      membership_permanent: after.permanent,
      membership_term: input?.membershipTerm || '1y',
      source: 'web',
    });
    return {
      expiresOn: after.expiresOn,
      permanent: after.permanent,
      status: after.status,
      updated: true,
    };
  } catch (error) {
    writeWebFailure('membership_extended', error, {
      account_id: accountId,
      actor,
      user,
    });
    throw error;
  }
}

export async function runDashboardRenewal(
  accountId,
  input,
  { actor = null } = {},
) {
  let user = null;
  const plate = String(input.licenseNumber || '').trim();
  try {
    ({ user } = getAccountById(accountId));
    const api = createApi(user);
    if (!plate) {
      throw new WebServiceError('请选择要检查的车辆', 400);
    }
    const dryRun = input.dryRun === true;
    const membership = getMembershipInfo(user);
    if (!dryRun && !membership.active) {
      writeAuditEvent('renewal_skipped', {
        account: getAccountLabel(user),
        actor,
        result: 'skipped',
        reason: 'membership_expired',
        membership_expires_on: membership.expiresOn,
        plate,
        source: 'web',
      });
      const expiredError = new WebServiceError(
        '服务有效期已到期，请续费后再执行续签',
        403,
      );
      expiredError.auditHandled = true;
      throw expiredError;
    }
    if (input.entryType && !ENTRY_TYPES.has(input.entryType)) {
      throw new WebServiceError('进京证类型只能是六环内或六环外', 400);
    }
    const result = await applyPermit(
      api,
      user,
      plate,
      input.entryType || undefined,
      { dryRun },
    );
    writeAuditEvent(
      result.applied
        ? 'renewal_submitted'
        : dryRun
          ? 'renewal_dry_run'
          : 'renewal_skipped',
      {
        account: getAccountLabel(user),
        actor,
        result: 'success',
        reason: result.reason,
        plate,
        apply_date: result.applyDate || null,
        source: 'web',
      },
    );
    return {
      applied: result.applied,
      dryRun: result.dryRun === true,
      reason: result.reason,
      message: result.message,
      applyDate: result.applyDate || null,
    };
  } catch (error) {
    if (!error?.auditHandled) {
      writeWebFailure('renewal_failed', error, {
        account_id: accountId,
        actor,
        plate: plate || null,
        user,
      });
    }
    throw error;
  }
}

function getAuditAccountDisplayNames() {
  const accountNames = new Map();
  for (const [index, user] of getUsers({ initializedOnly: true }).entries()) {
    const label = getAccountLabel(user, index);
    const phone = String(user.bjt_phone || '');
    for (const key of [label, maskPhone(label)]) {
      if (key) accountNames.set(key, label);
    }
    for (const key of [phone, maskPhone(phone)]) {
      if (key) accountNames.set(key, phone);
    }
  }
  return accountNames;
}

export function getDashboardAudit(options = {}) {
  const data = queryAuditEvents({
    since: options.since || '30d',
    account: options.account || null,
    event: options.event || null,
    events: options.events
      ? String(options.events).split(',').filter(Boolean)
      : null,
    status: options.status || null,
    page: options.page || 1,
    pageSize: options.pageSize || options.limit || 20,
  });
  const accountNames = getAuditAccountDisplayNames();
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      account: accountNames.get(item.account) || item.account,
    })),
  };
}

export class WebServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'WebServiceError';
    this.statusCode = statusCode;
  }
}
