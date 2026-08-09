import {
  getAccountLabel,
  getSelectedUsers,
} from '../lib/config-manager.js';
import { ApiManager } from '../lib/api-manager.js';
import { API_BASE_URL, COMMAND_NAME } from '../constants.js';
import {
  parseStateData, getLatestRecord, calcRemainingDays,
  parseVehicle, parseUserInfo, buildApplyPayload,
  formatDate, getFutureDate,
} from '../lib/models.js';
import { notify } from '../lib/notifier.js';
import {
  isCompleteTripProfile,
  requireTripProfile,
} from '../lib/trip-profile.js';
import { writeAuditEvent } from '../lib/audit-logger.js';
import { getMembershipInfo } from '../lib/membership.js';
import { output, success, error } from '../output.js';

const ACTIVE_STATUSES = ['审核通过(生效中)', '审核中', '审核通过(待生效)'];

function needApply(record) {
  if (!record) return formatDate(new Date());
  const status = record.statusName;
  const remaining = calcRemainingDays(record);
  if (ACTIVE_STATUSES.includes(status)) {
    if (status === '审核通过(生效中)' && remaining <= 1) {
      return getFutureDate(formatDate(new Date()), 1);
    }
    return null;
  }
  return formatDate(new Date());
}

function selectVehicle(state, preferredPlate) {
  const vehicles = state.vehicles || [];
  if (vehicles.length === 0) return null;
  for (const v of vehicles) {
    const record = getLatestRecord(v);
    if (record && ACTIVE_STATUSES.includes(record.statusName)) return v;
  }
  if (preferredPlate) {
    const preferred = vehicles.find((v) => v.licenseNumber === preferredPlate);
    if (preferred) return preferred;
  }
  return vehicles[0];
}

function getPreviewApplyDate(record) {
  if (!record) return formatDate(new Date());
  if (record.validTo) return getFutureDate(record.validTo, 1);
  return getFutureDate(formatDate(new Date()), 1);
}

function maskIdentityNumber(value) {
  if (!value) return '';
  return value.replace(/^(.{3}).*(.{4})$/, '$1***********$2');
}

function formatDryRun(label, result) {
  const payload = result.payload;
  return (
    `[${label}] DRY RUN：未提交申请\n` +
    `计划生效日期: ${payload.jjrq}\n` +
    `车牌: ${payload.hphm}\n` +
    `进京证类型: ${payload.jjzzl === '01' ? '六环内' : '六环外'}\n` +
    `是否已在京: ${String(payload.sfzj) === '1' ? '是' : '否'}\n` +
    `当前申请位置: ${payload.sqdzgdjd}, ${payload.sqdzgdwd}\n` +
    `在京地址: ${payload.zjxxdz} ` +
    `(${payload.zjxxdzgdjd}, ${payload.zjxxdzgdwd})\n` +
    `进京目的地: ${payload.xxdz} ` +
    `(${payload.jjdzgdjd}, ${payload.jjdzgdwd})\n` +
    `目的地区县: ${payload.area} (${payload.jjdq})\n` +
    `进京目的: ${payload.jjmdmc} (${payload.jjmd})\n` +
    `驾驶人证件: ${maskIdentityNumber(payload.jszh)}`
  );
}

export async function applyPermit(
  api,
  user,
  plate,
  entryTypeOverride,
  { dryRun = false, tripProfile = null } = {},
) {
  const { state: rawState } = await api.loadHomePageData();
  const state = parseStateData(rawState);
  const targetPlate = plate || user.preferred_vehicle;
  const vehicle = plate
    ? (state.vehicles || []).find((v) => v.licenseNumber === plate) || null
    : selectVehicle(state, targetPlate);
  if (!vehicle) {
    return {
      applied: false,
      reason: 'no_vehicle',
      message: '未找到绑定车辆',
      record: null,
      vehicle: null,
    };
  }
  const record = getLatestRecord(vehicle);
  const quotaExhausted = String(vehicle.remainingTimes) === '0' && String(vehicle.remainingDays) === '0';
  if (quotaExhausted && !dryRun) {
    return {
      applied: false,
      reason: 'quota_exhausted',
      message: `无法续签（剩余次数和天数已用完）- ${vehicle.licenseNumber}`,
      record,
      vehicle,
    };
  }
  const requiredApplyDate = needApply(record);
  if (!requiredApplyDate && !dryRun) {
    const remaining = record ? calcRemainingDays(record) : 0;
    return {
      applied: false,
      reason: 'not_due',
      message: `无需续签 - ${vehicle.licenseNumber} 当前状态: ${record?.statusName}，剩余 ${remaining} 天`,
      record,
      vehicle,
    };
  }
  const applyDate = requiredApplyDate || getPreviewApplyDate(record);
  const rawVehicles = await api.listVehicles();
  const fullVehicle = rawVehicles.map(parseVehicle).find((v) => v.licenseNumber === vehicle.licenseNumber);
  if (!fullVehicle) {
    return { applied: false, message: `未找到车辆详细信息: ${vehicle.licenseNumber}`, record, vehicle };
  }
  const rawUserInfo = await api.getUserInfo();
  const userInfo = parseUserInfo(rawUserInfo);
  const entryType = entryTypeOverride || user.entry_type || '六环外';
  const payload = buildApplyPayload(
    fullVehicle,
    userInfo,
    applyDate,
    entryType,
    requireTripProfile(tripProfile || user.trip_profile),
  );
  if (dryRun) {
    return {
      applied: false,
      reason: 'dry_run',
      dryRun: true,
      message: `已生成申请预览 - ${vehicle.licenseNumber}`,
      payload,
      record,
      vehicle,
      applyDate,
    };
  }
  await api.submitApply(payload);
  return {
    applied: true,
    reason: 'submitted',
    message: `已提交续签申请 - ${vehicle.licenseNumber} 申请日期: ${applyDate} 类型: ${entryType}`,
    record,
    vehicle,
    applyDate,
  };
}

/**
 * Complete flow: apply + status + notify.
 * Matches Python cross_bj.py exec() logic and notification format.
 */
async function runForUser(
  user,
  { plate, entryType, noNotify, dryRun },
  includeLabel,
) {
  const label = getAccountLabel(user);
  const prefix = includeLabel ? `[${label}] ` : '';
  const api = new ApiManager(API_BASE_URL, user.auth);
  const applyResult = await applyPermit(
    api,
    user,
    plate,
    entryType,
    { dryRun },
  );
  if (applyResult.dryRun) {
    writeAuditEvent('renewal_dry_run', {
      account: label,
      result: 'success',
      plate: applyResult.vehicle?.licenseNumber || null,
      apply_date: applyResult.applyDate,
      entry_type: entryType || user.entry_type || '六环外',
    });
    const safePayload = {
      ...applyResult.payload,
      jszh: maskIdentityNumber(applyResult.payload.jszh),
    };
    output(
      success(
        {
          account: label,
          dryRun: true,
          payload: safePayload,
        },
        formatDryRun(label, applyResult),
      ),
    );
    return;
  }
  const msg = applyResult.applied ? '续签成功' : '无需续签';
  const record = applyResult.record;
  const vehicle = applyResult.vehicle;
  writeAuditEvent(
    applyResult.applied ? 'renewal_submitted' : 'renewal_skipped',
    {
      account: label,
      result: 'success',
      reason: applyResult.reason,
      plate: vehicle?.licenseNumber || null,
      record_status: record?.statusName || null,
      valid_to: record?.validTo || null,
      remaining_days: record ? calcRemainingDays(record) : null,
      remaining_times: vehicle?.remainingTimes ?? null,
      apply_date: applyResult.applyDate || null,
    },
  );

  if (!record || !vehicle) {
    if (!noNotify && user.notify_urls?.length > 0) {
      await notify(
        user.notify_urls,
        `[${label}] 进京证`,
        `${msg}\n无法获取状态信息`,
      );
    }
    output(
      success(
        { account: label, apply: applyResult },
        `${prefix}${msg}\n无法获取状态信息`,
      ),
    );
    return;
  }

  const startDate = record.validFrom;
  const endDate = record.validTo || getFutureDate(record.validFrom, 6);
  const remainingDays = calcRemainingDays(record);
  const now = new Date();
  const formattedTime =
    `${formatDate(now)} ` +
    `${String(now.getHours()).padStart(2, '0')}:` +
    `${String(now.getMinutes()).padStart(2, '0')}:` +
    `${String(now.getSeconds()).padStart(2, '0')}`;
  const title =
    `进京证${msg}: ${startDate.substring(5)}~${endDate.substring(5)}`;

  let body = `${msg}\n`;
  body += `状态: ${record.statusName}\n`;
  body += `有效期: ${startDate}至${endDate}\n`;
  body += `剩余天数: ${remainingDays}\n`;
  body += `类型: ${record.entryTypeName}\n`;
  body += `申请时间: ${record.applyTime}\n`;
  body += `执行时间: ${formattedTime}\n`;
  body += `剩余申请次数: ${vehicle.remainingTimes}\n`;

  if (!noNotify && user.notify_urls?.length > 0) {
    await notify(user.notify_urls, `[${label}] ${title}`, body);
  }
  output(
    success(
      { account: label, apply: applyResult },
      `${prefix}${title}\n${body}`,
    ),
  );
}

export async function runCommand({
  account,
  plate,
  entryType,
  noNotify,
  dryRun = false,
} = {}) {
  let users;
  try {
    users = getSelectedUsers(account);
  } catch (err) {
    output(error(`运行失败: ${err.message}`));
    process.exitCode = 1;
    return;
  }
  if (users.length === 0) {
    output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
    process.exitCode = 1;
    return;
  }

  const includeLabel = users.length > 1 || Boolean(account);
  for (const user of users) {
    const membership = getMembershipInfo(user);
    if (!membership.active && !dryRun) {
      writeAuditEvent('renewal_skipped', {
        account: getAccountLabel(user),
        result: 'skipped',
        reason: 'membership_expired',
        membership_expires_on: membership.expiresOn,
      });
      output(
        success(
          {
            account: getAccountLabel(user),
            skipped: true,
            reason: 'membership_expired',
          },
          `[${getAccountLabel(user)}] 服务已于 ${membership.expiresOn || '未知日期'} 到期，跳过`,
        ),
      );
      continue;
    }
    if (user.auto_renew === false && !dryRun) {
      writeAuditEvent('renewal_skipped', {
        account: getAccountLabel(user),
        result: 'success',
        reason: 'auto_renew_disabled',
      });
      output(
        success(
          {
            account: getAccountLabel(user),
            skipped: true,
            reason: 'auto_renew_disabled',
          },
          `[${getAccountLabel(user)}] 已关闭自动续签，跳过`,
        ),
      );
      continue;
    }
    if (!isCompleteTripProfile(user.trip_profile)) {
      const message = '未配置完整的出行信息，请先运行 trip set';
      writeAuditEvent(
        'renewal_failed',
        {
          account: getAccountLabel(user),
          result: 'failure',
          error: message,
        },
        { level: 'error' },
      );
      output(error(`[${getAccountLabel(user)}] 运行失败: ${message}`));
      process.exitCode = 1;
      continue;
    }
    try {
      writeAuditEvent('renewal_check_started', {
        account: getAccountLabel(user),
        result: 'started',
        dry_run: dryRun,
      });
      await runForUser(
        user,
        { plate, entryType, noNotify, dryRun },
        includeLabel,
      );
    } catch (err) {
      writeAuditEvent(
        'renewal_failed',
        {
          account: getAccountLabel(user),
          result: 'failure',
          error: err.message,
        },
        { level: 'error' },
      );
      if (!noNotify && user.notify_urls?.length > 0) {
        try {
          await notify(
            user.notify_urls,
            `[${getAccountLabel(user)}] 进京证续签失败`,
            `续签执行失败: ${err.message}`,
          );
        } catch {
          // ignore notification errors
        }
      }
      output(
        error(`[${getAccountLabel(user)}] 运行失败: ${err.message}`),
      );
      process.exitCode = 1;
    }
  }
}

export function registerRunCommand(program) {
  program
    .command('run')
    .description('续签进京证（默认依次处理全部账号）')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .option('--plate <plate>', '指定车牌号（默认使用首选车辆）')
    .option('--entry-type <type>', '进京证类型: 六环内/六环外（默认使用配置值）')
    .option('--no-notify', '不发送通知')
    .option('--dry-run', '只生成并显示申请请求，不提交')
    .action(async (options) => {
      await runCommand({
        account: options.account,
        plate: options.plate,
        entryType: options.entryType,
        noNotify: options.noNotify,
        dryRun: options.dryRun,
      });
    });
}
