import {
  getAccountLabel,
  getSystemDefaultTripProfile,
  getSelectedUsers,
} from '../lib/config-manager.js';
import { COMMAND_NAME } from '../constants.js';
import { createAuthenticatedApi } from '../lib/authenticated-api.js';
import {
  parseStateData,
  getLatestRecord,
  calcRemainingDays,
  daysBetweenInclusive,
  formatDate,
  getFutureDate,
} from '../lib/models.js';
import { notify } from '../lib/notifier.js';
import {
  getTripProfileMode,
  resolveUserTripProfile,
} from '../lib/trip-profile.js';
import { output, success, error } from '../output.js';
import { getCronScheduleInfo } from './cron.js';

export function formatAutoRenewText(
  enabled,
  scheduleInfo,
) {
  if (!enabled) {
    return '已关闭';
  }

  if (scheduleInfo.active) {
    return '已开启';
  }

  return '已开启（未设置定时任务）';
}

export function formatNextRenewTime(scheduleInfo, validTo) {
  if (!scheduleInfo.active || !validTo) {
    return null;
  }
  if (scheduleInfo.randomWindow) {
    return `${validTo} ${scheduleInfo.randomWindow} 内随机`;
  }
  if (scheduleInfo.dailyTime) {
    return `${validTo} ${scheduleInfo.dailyTime}`;
  }
  return `${validTo}（${scheduleInfo.description}）`;
}

export function formatValidityText(record, endDate, now = new Date()) {
  const today = formatDate(now);
  if (record.validFrom > today) {
    const validDays = daysBetweenInclusive(record.validFrom, endDate);
    const daysUntilStart =
      daysBetweenInclusive(today, record.validFrom) - 1;
    const startsAt =
      daysUntilStart === 1
        ? '明天生效'
        : `${daysUntilStart} 天后生效`;
    return (
      `${record.validFrom} 至 ${endDate}` +
      `（有效期 ${validDays} 天，${startsAt}）`
    );
  }

  return (
    `${record.validFrom} 至 ${endDate}` +
    `（剩余 ${calcRemainingDays(record, now)} 天）`
  );
}

async function getStatusForUser(
  user,
  options,
  includeLabel,
  scheduleInfo,
) {
  const api = createAuthenticatedApi(user);
  const { state: rawState } = await api.loadHomePageData();
  const state = parseStateData(rawState);
  const label = getAccountLabel(user);
  const prefix = includeLabel ? `[${label}] ` : '';
  const autoRenewEnabled = user.auto_renew !== false;

  if (!state.vehicles || state.vehicles.length === 0) {
    const autoRenewText = formatAutoRenewText(
      autoRenewEnabled,
      scheduleInfo,
    );
    return {
      data: {
        account: label,
        autoRenew: autoRenewEnabled,
        autoRenewSchedule: scheduleInfo,
        state,
      },
      message:
        `${prefix}未找到绑定车辆\n` +
        `自动续签: ${autoRenewText}`,
    };
  }

  const targetPlate = options.plate || user.preferred_vehicle;
  const vehicle =
    (targetPlate &&
      state.vehicles.find((item) => item.licenseNumber === targetPlate)) ||
    state.vehicles[0];
  const record = getLatestRecord(vehicle);
  const remaining = record ? calcRemainingDays(record) : 0;

  const activeStatuses = [
    '审核通过(生效中)',
    '审核中',
    '审核通过(待生效)',
  ];
  const quotaExhausted =
    String(vehicle.remainingTimes) === '0' &&
    String(vehicle.remainingDays) === '0';
  let needRenew;
  if (!record) {
    needRenew = true;
  } else if (activeStatuses.includes(record.statusName)) {
    needRenew =
      record.statusName === '审核通过(生效中)' && remaining <= 1;
  } else {
    needRenew = true;
  }

  const startDate = record ? record.validFrom : '';
  const endDate = record
    ? record.validTo || getFutureDate(record.validFrom, 6)
    : '';
  const autoRenewText = formatAutoRenewText(
    autoRenewEnabled,
    scheduleInfo,
  );
  const nextRenewTime = autoRenewEnabled
    ? formatNextRenewTime(scheduleInfo, endDate || null)
    : null;
  const renewalStatus =
    quotaExhausted && needRenew
      ? '无法续签（剩余次数和天数已用完）'
      : needRenew
        ? '需要续签'
        : '当前无需续签';
  const now = new Date();
  const formattedTime =
    `${formatDate(now)} ` +
    `${String(now.getHours()).padStart(2, '0')}:` +
    `${String(now.getMinutes()).padStart(2, '0')}:` +
    `${String(now.getSeconds()).padStart(2, '0')}`;
  const title = '进京证状态';

  let body = `证件状态: ${record ? record.statusName : '无记录'}\n`;
  if (record) {
    body += `有效期: ${formatValidityText(record, endDate)}\n`;
  }
  if (renewalStatus !== '当前无需续签') {
    body += `续签状态: ${renewalStatus}\n`;
  }
  body +=
    `自动续签: ${autoRenewText}` +
    (nextRenewTime ? `（下次：${nextRenewTime}）` : '') +
    '\n';
  const tripProfile = resolveUserTripProfile(
    user,
    getSystemDefaultTripProfile(),
  );
  if (tripProfile) {
    const { destination, in_beijing_address: inBeijingAddress } = tripProfile;
    body +=
      `在京地址: ${inBeijingAddress.address} ` +
      `(${inBeijingAddress.longitude}, ${inBeijingAddress.latitude})\n`;
    body +=
      `进京目的地: ${destination.address} ` +
      `(${destination.longitude}, ${destination.latitude})\n`;
  } else {
    body += '出行配置: 未配置（自动续签不会执行）\n';
  }
  body += `车牌: ${vehicle.licenseNumber}\n`;
  if (record) {
    body += `类型: ${record.entryTypeName || ''}\n`;
    body += `申请时间: ${record.applyTime || ''}\n`;
  }
  body += `执行时间: ${formattedTime}\n`;
  body += `剩余申请次数: ${vehicle.remainingTimes}\n`;

  if (options.verbose) {
    const maskedPhone = user.bjt_phone
      ? user.bjt_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      : '未设置';
    body += '\n--- 配置信息 ---\n';
    body += `账号: ${label}\n`;
    body += `手机号: ${maskedPhone}\n`;
    body += `进京证类型: ${user.entry_type || '六环外'}\n`;
    body += `通知渠道数: ${(user.notify_urls || []).length}\n`;
    body += `首选车辆: ${user.preferred_vehicle || '未设置'}\n`;
    body += `出行配置来源: ${getTripProfileMode(user) === 'default' ? '系统默认' : tripProfile ? '账号自定义' : '未配置'}\n`;
    body += `是否已在京: ${tripProfile ? '是' : '未配置'}\n`;
    if (tripProfile) {
      body +=
        `目的地区县: ${tripProfile.destination.area} ` +
        `(${tripProfile.destination.district_code})\n`;
    }
  }

  if (options.notify && user.notify_urls?.length > 0) {
    await notify(user.notify_urls, `[${label}] ${title}`, body);
  }

  return {
    data: {
      account: label,
      autoRenew: autoRenewEnabled,
      autoRenewSchedule: scheduleInfo,
      state,
      record,
      needRenew,
    },
    message: `${prefix}${title}\n${body}`,
  };
}

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('查看进京证状态（默认全部账号）')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .option('-v, --verbose', '显示详细配置信息')
    .option('-n, --notify', '将状态通过通知渠道发送')
    .option('--plate <plate>', '指定车牌号（默认使用首选车辆）')
    .action(async (options) => {
      let users;
      try {
        users = getSelectedUsers(options.account);
      } catch (err) {
        output(error(`查询状态失败: ${err.message}`));
        process.exitCode = 1;
        return;
      }
      if (users.length === 0) {
        output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
        process.exitCode = 1;
        return;
      }

      const includeLabel = users.length > 1 || Boolean(options.account);
      const scheduleInfo = getCronScheduleInfo();
      for (const user of users) {
        try {
          const result = await getStatusForUser(
            user,
            options,
            includeLabel,
            scheduleInfo,
          );
          output(success(result.data, result.message));
        } catch (err) {
          output(
            error(
              `[${getAccountLabel(user)}] 查询状态失败: ${err.message}`,
            ),
          );
          process.exitCode = 1;
        }
      }
    });
}
