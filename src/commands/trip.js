import {
  getAccountLabel,
  getMutationUser,
  updateUser,
} from '../lib/config-manager.js';
import { output, success, error } from '../output.js';
import { COMMAND_NAME } from '../constants.js';
import { resolveTripProfile } from '../lib/trip-profile.js';
import { writeAuditEvent } from '../lib/audit-logger.js';

function normalizeCoordinate(value, label, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${label}无效: ${value}`);
  }
  return String(value).trim();
}

function formatTripProfile(user) {
  const profile = resolveTripProfile(user.trip_profile);
  const source = user.trip_profile ? '账号配置' : '系统默认';
  return (
    `账号: ${getAccountLabel(user)}\n` +
    `地址来源: ${source}\n` +
    `是否已在京: ${profile.is_in_beijing ? '是' : '否'}\n` +
    `在京地址: ${profile.in_beijing_address.address} ` +
    `(${profile.in_beijing_address.longitude}, ${profile.in_beijing_address.latitude})\n` +
    `进京目的地: ${profile.destination.address} ` +
    `(${profile.destination.longitude}, ${profile.destination.latitude})\n` +
    `目的地区县: ${profile.destination.area} ` +
    `(${profile.destination.district_code})\n` +
    `进京目的: ${profile.purpose.name} (${profile.purpose.code})`
  );
}

export function registerTripCommand(program) {
  const trip = program
    .command('trip')
    .description('管理每个账号的真实出行地址');

  trip
    .command('set')
    .description('设置“已在京”的当前位置和进京目的地')
    .requiredOption('--account <account>', '账号名称、手机号或序号')
    .option('--address <address>', '同时设置在京地址和进京目的地（兼容旧用法）')
    .option('--longitude <longitude>', '同时设置两处的高德经度（兼容旧用法）')
    .option('--latitude <latitude>', '同时设置两处的高德纬度（兼容旧用法）')
    .option('--in-beijing-address <address>', '在京地址')
    .option('--in-beijing-longitude <longitude>', '在京地址的高德经度')
    .option('--in-beijing-latitude <latitude>', '在京地址的高德纬度')
    .option('--destination-address <address>', '进京目的地')
    .option('--destination-longitude <longitude>', '进京目的地的高德经度')
    .option('--destination-latitude <latitude>', '进京目的地的高德纬度')
    .option('--area <area>', '目的地区县，如“平谷区”')
    .option('--district-code <code>', '小程序区县字典代码')
    .option('--purpose-name <name>', '进京目的名称')
    .option('--purpose-code <code>', '进京目的字典代码')
    .action((options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }

        const previousProfile = user.trip_profile;
        const inBeijingAddress = (
          options.inBeijingAddress ??
          options.address ??
          previousProfile?.in_beijing_address?.address ??
          ''
        ).trim();
        const destinationAddress = (
          options.destinationAddress ??
          options.address ??
          previousProfile?.destination?.address ??
          ''
        ).trim();
        const area = (
          options.area ??
          previousProfile?.destination?.area ??
          ''
        ).trim();
        const districtCode = (
          options.districtCode ??
          previousProfile?.destination?.district_code ??
          ''
        ).trim();
        const purposeName = (
          options.purposeName ??
          previousProfile?.purpose?.name ??
          '其它'
        ).trim();
        const purposeCode = (
          options.purposeCode ??
          previousProfile?.purpose?.code ??
          '06'
        ).trim();
        if (
          !inBeijingAddress ||
          !destinationAddress ||
          !area ||
          !districtCode ||
          !purposeName ||
          !purposeCode
        ) {
          throw new Error(
            '在京地址、进京目的地、区县、区县代码和进京目的不能为空',
          );
        }

        const inBeijingLongitude = normalizeCoordinate(
          options.inBeijingLongitude ??
            options.longitude ??
            previousProfile?.in_beijing_address?.longitude,
          '在京地址经度',
          -180,
          180,
        );
        const inBeijingLatitude = normalizeCoordinate(
          options.inBeijingLatitude ??
            options.latitude ??
            previousProfile?.in_beijing_address?.latitude,
          '在京地址纬度',
          -90,
          90,
        );
        const destinationLongitude = normalizeCoordinate(
          options.destinationLongitude ??
            options.longitude ??
            previousProfile?.destination?.longitude,
          '进京目的地经度',
          -180,
          180,
        );
        const destinationLatitude = normalizeCoordinate(
          options.destinationLatitude ??
            options.latitude ??
            previousProfile?.destination?.latitude,
          '进京目的地纬度',
          -90,
          90,
        );

        const tripProfile = {
          is_in_beijing: true,
          current_location: {
            longitude: inBeijingLongitude,
            latitude: inBeijingLatitude,
          },
          in_beijing_address: {
            address: inBeijingAddress,
            longitude: inBeijingLongitude,
            latitude: inBeijingLatitude,
          },
          destination: {
            address: destinationAddress,
            longitude: destinationLongitude,
            latitude: destinationLatitude,
            area,
            district_code: districtCode,
          },
          purpose: {
            name: purposeName,
            code: purposeCode,
          },
          confirmed_at: new Date().toISOString(),
        };
        const updated = updateUser(
          { trip_profile: tripProfile },
          user.bjt_phone,
        );
        writeAuditEvent('trip_profile_changed', {
          account: getAccountLabel(updated),
          result: 'success',
          profile_source: 'custom',
          area,
          district_code: districtCode,
          purpose_code: purposeCode,
        });
        output(
          success(
            { account: getAccountLabel(updated), tripProfile },
            `出行地址已保存\n${formatTripProfile(updated)}`,
          ),
        );
      } catch (err) {
        output(error(`设置出行地址失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  trip
    .command('show')
    .description('查看指定账号的出行地址')
    .requiredOption('--account <account>', '账号名称、手机号或序号')
    .action((options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }
        output(
          success(
            {
              account: getAccountLabel(user),
              tripProfile: resolveTripProfile(user.trip_profile),
              usesDefault: !user.trip_profile,
            },
            formatTripProfile(user),
          ),
        );
      } catch (err) {
        output(error(`查询出行地址失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
