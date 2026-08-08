import { getCronScheduleInfo } from '../commands/cron.js';
import { applyPermit } from '../commands/run.js';
import { API_BASE_URL } from '../constants.js';
import { ApiManager } from '../lib/api-manager.js';
import {
  getAccountLabel,
  getUsers,
  resolveUser,
  updateUser,
} from '../lib/config-manager.js';
import {
  maskPlate,
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

const ENTRY_TYPES = new Set(['六环内', '六环外']);
const PLATE_TYPES = new Set(['01', '02', '06', '13', '51', '52']);
const VEHICLE_TYPES = new Set(['01', '02']);

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function writeWebFailure(event, error, { user = null, ...fields } = {}) {
  writeAuditEvent(
    event,
    {
      ...fields,
      account: user ? getAccountLabel(user) : null,
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
  const user = resolveUser(users, accountId);
  if (!user) {
    throw new WebServiceError('账号不存在或尚未完成初始化', 404);
  }
  return { user, users };
}

function createApi(user) {
  return new ApiManager(API_BASE_URL, user.auth);
}

function maskPhone(value) {
  return String(value || '').replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
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
  const account = {
    id: String(index + 1),
    name: getAccountLabel(user, index),
    phone: maskPhone(user.bjt_phone),
    entryType: user.entry_type || '六环外',
    autoRenew: user.auto_renew !== false,
    preferredVehicle: user.preferred_vehicle || '',
    tripProfile: resolveTripProfile(user.trip_profile),
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
    for (const vehicle of account.vehicles) {
      const maskedPlate = maskPlate(vehicle.licenseNumber);
      const lastExecution = auditEvents.find(
        (event) =>
          event.account === account.name &&
          event.plate === maskedPlate &&
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

export async function addDashboardVehicle(accountId, input) {
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
      plate: input?.licenseNumber || null,
      user,
    });
    throw error;
  }
}

export async function removeDashboardVehicle(accountId, vehicleId) {
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
      result: 'success',
      plate: vehicle.licenseNumber,
      source: 'web',
    });
    return { licenseNumber: vehicle.licenseNumber };
  } catch (error) {
    writeWebFailure('vehicle_removed', error, {
      account_id: accountId,
      plate: vehicle?.licenseNumber || null,
      user,
      vehicle_id: vehicleId,
    });
    throw error;
  }
}

export function updateDashboardAccount(accountId, input) {
  let user = null;
  try {
    ({ user } = getAccountById(accountId));
    const updates = {};
    if (Object.hasOwn(input, 'autoRenew')) {
      if (typeof input.autoRenew !== 'boolean') {
        throw new WebServiceError('自动续签开关必须是布尔值', 400);
      }
      updates.auto_renew = input.autoRenew;
    }
    if (Object.hasOwn(input, 'entryType')) {
      if (!ENTRY_TYPES.has(input.entryType)) {
        throw new WebServiceError('进京证类型只能是六环内或六环外', 400);
      }
      updates.entry_type = input.entryType;
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
      result: 'success',
      changed_fields: Object.keys(updates),
      source: 'web',
    });
    return { updated: true };
  } catch (error) {
    writeWebFailure('config_changed', error, {
      account_id: accountId,
      attempted_fields: Object.keys(input || {}),
      user,
    });
    throw error;
  }
}

export async function runDashboardRenewal(accountId, input) {
  let user = null;
  const plate = String(input.licenseNumber || '').trim();
  try {
    ({ user } = getAccountById(accountId));
    const api = createApi(user);
    if (!plate) {
      throw new WebServiceError('请选择要检查的车辆', 400);
    }
    const dryRun = input.dryRun === true;
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
    writeWebFailure('renewal_failed', error, {
      account_id: accountId,
      plate: plate || null,
      user,
    });
    throw error;
  }
}

export function getDashboardAudit(options = {}) {
  return queryAuditEvents({
    since: options.since || '30d',
    account: options.account || null,
    event: options.event || null,
    status: options.status || null,
    page: options.page || 1,
    pageSize: options.pageSize || options.limit || 20,
  });
}

export class WebServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'WebServiceError';
    this.statusCode = statusCode;
  }
}
