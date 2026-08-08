import {
  getAccountLabel,
  getMutationUser,
  updateUser,
} from '../lib/config-manager.js';
import { ApiManager } from '../lib/api-manager.js';
import { API_BASE_URL, COMMAND_NAME } from '../constants.js';
import { parseVehicle, vehicleToApiDict } from '../lib/models.js';
import { output, success, error } from '../output.js';
import { VEHICLE_TYPE_MAP, LICENSE_PLATE_TYPE_MAP } from '../constants.js';
import { writeAuditEvent } from '../lib/audit-logger.js';

async function getApi(account) {
  const user = getMutationUser(account);
  if (!user) {
    throw new Error(`尚未初始化，请先运行 ${COMMAND_NAME} init`);
  }
  const baseUrl = API_BASE_URL;
  const api = new ApiManager(baseUrl, user.auth);
  return { api, user };
}

/**
 * 校验首选车辆：
 * - 只有一辆车 → 自动设为首选
 * - 首选车辆已不存在 → 清空
 * - 无车辆 → 清空
 */
async function syncPreferred(api, user) {
  try {
    const rawVehicles = await api.listVehicles();
    const vehicles = rawVehicles.map(parseVehicle);
    const preferred = user.preferred_vehicle || '';

    if (vehicles.length === 0) {
      if (preferred) {
        updateUser({ preferred_vehicle: '' }, user.bjt_phone);
      }
    } else if (vehicles.length === 1) {
      if (preferred !== vehicles[0].licenseNumber) {
        updateUser(
          { preferred_vehicle: vehicles[0].licenseNumber },
          user.bjt_phone,
        );
      }
    } else if (preferred && !vehicles.find((v) => v.licenseNumber === preferred)) {
      updateUser({ preferred_vehicle: '' }, user.bjt_phone);
    }
  } catch {
    // 同步失败不影响主操作
  }
}

export function registerVehicleCommand(program) {
  const vehicle = program.command('vehicle').description('车辆管理');

  vehicle
    .command('list')
    .description('查看绑定车辆')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (options) => {
      try {
        const { api, user } = await getApi(options.account);
        const rawVehicles = await api.listVehicles();
        const vehicles = rawVehicles.map(parseVehicle);
        const preferred = user.preferred_vehicle || '';

        if (vehicles.length === 0) {
          output(success([], '未绑定任何车辆'));
          return;
        }

        let message = '绑定车辆列表:\n';
        vehicles.forEach((v, i) => {
          const isPreferred = v.licenseNumber === preferred || vehicles.length === 1;
          const star = isPreferred ? ' ⭐ 首选' : '';
          message += `\n${i + 1}. ${v.licenseNumber}${star}`;
          message += `\n   类型: ${v.vehicleTypeName} | 号牌: ${v.licensePlateTypeName}`;
          message += `\n   发动机号: ${v.engineNumber}`;
          message += `\n   品牌: ${v.brand}`;
        });

        output(success(vehicles, message));
      } catch (err) {
        output(error(`查询车辆失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  vehicle
    .command('add')
    .description('添加车辆')
    .requiredOption('--plate <plate>', '号牌号码')
    .requiredOption('--engine <engine>', '发动机号后6位字母数字，若无则填"无"')
    .requiredOption('--brand <brand>', '品牌型号（字母数字，忽略大小写和其它字符）')
    .requiredOption('--reg-date <date>', '注册日期（YYYY-MM-DD）')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .option('--plate-type <type>', '号牌种类: 02=小型汽车 52=小型新能源 01=大型汽车 51=大型新能源 06=外籍 13=低速（默认按车牌长度推断：8位=新能源，7位=小型汽车）')
    .option('--vehicle-type <type>', '车辆类型: 01=客车 02=货车', '01')
    .action(async (options) => {
      try {
        const { api, user } = await getApi(options.account);

        const defaultPlateType = options.plate.length >= 8 ? '52' : '02';
        const plateType = options.plateType ?? defaultPlateType;

        const vehicle = {
          licenseNumber: options.plate,
          engineNumber: options.engine,
          licensePlateType: plateType,
          vehicleType: options.vehicleType,
          brand: options.brand,
          registrationDate: options.regDate,
        };
        const vehicleDict = vehicleToApiDict(vehicle);

        await api.addVehicle(vehicleDict);
        await syncPreferred(api, user);
        writeAuditEvent('vehicle_added', {
          account: getAccountLabel(user),
          result: 'success',
          plate: options.plate,
          plate_type: plateType,
          vehicle_type: options.vehicleType,
        });
        output(success({ plate: options.plate }, `车辆 ${options.plate} 添加成功`));
      } catch (err) {
        writeAuditEvent(
          'vehicle_added',
          {
            account: options.account || null,
            error: err.message,
            plate: options.plate,
            result: 'failure',
          },
          { level: 'error' },
        );
        output(error(`添加车辆失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  vehicle
    .command('remove <plate>')
    .description('删除车辆')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (plate, options) => {
      try {
        const { api, user } = await getApi(options.account);
        const rawVehicles = await api.listVehicles();
        const vehicles = rawVehicles.map(parseVehicle);

        const target = vehicles.find((v) => v.licenseNumber === plate);
        if (!target) {
          writeAuditEvent(
            'vehicle_removed',
            {
              account: getAccountLabel(user),
              error: `未找到车牌为 ${plate} 的车辆`,
              plate,
              result: 'failure',
            },
            { level: 'error' },
          );
          output(error(`未找到车牌为 ${plate} 的车辆`));
          process.exitCode = 1;
          return;
        }

        await api.deleteVehicle(target.vehicleId);
        await syncPreferred(api, user);
        writeAuditEvent('vehicle_removed', {
          account: getAccountLabel(user),
          result: 'success',
          plate,
        });
        output(success({ plate }, `车辆 ${plate} 已删除`));
      } catch (err) {
        writeAuditEvent(
          'vehicle_removed',
          {
            account: options.account || null,
            error: err.message,
            plate,
            result: 'failure',
          },
          { level: 'error' },
        );
        output(error(`删除车辆失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  vehicle
    .command('swap <newPlate>')
    .description('换牌（保留其他信息，替换车牌号）')
    .option('--from <plate>', '要替换的原车牌号（默认首选车辆或第一辆）')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (newPlate, options) => {
      try {
        const { api, user } = await getApi(options.account);
        const rawVehicles = await api.listVehicles();
        const vehicles = rawVehicles.map(parseVehicle);

        if (vehicles.length === 0) {
          writeAuditEvent(
            'vehicle_plate_swapped',
            {
              account: getAccountLabel(user),
              error: '未绑定任何车辆',
              new_plate: newPlate,
              result: 'failure',
            },
            { level: 'error' },
          );
          output(error('未绑定任何车辆'));
          process.exitCode = 1;
          return;
        }

        // 找到要替换的车辆
        let target;
        if (options.from) {
          target = vehicles.find((v) => v.licenseNumber === options.from);
          if (!target) {
            writeAuditEvent(
              'vehicle_plate_swapped',
              {
                account: getAccountLabel(user),
                error: `未找到车牌为 ${options.from} 的车辆`,
                new_plate: newPlate,
                old_plate: options.from,
                result: 'failure',
              },
              { level: 'error' },
            );
            output(error(`未找到车牌为 ${options.from} 的车辆`));
            process.exitCode = 1;
            return;
          }
        } else {
          // 默认：首选车辆 → 第一辆
          const preferred = user.preferred_vehicle;
          target = (preferred && vehicles.find((v) => v.licenseNumber === preferred)) || vehicles[0];
        }

        const oldPlate = target.licenseNumber;

        // 先加新车牌（用相同信息，去掉旧 vId）
        const newVehicleDict = vehicleToApiDict(target);
        newVehicleDict.hphm = newPlate;
        delete newVehicleDict.vId;
        await api.addVehicle(newVehicleDict);

        // 再删旧车辆
        await api.deleteVehicle(target.vehicleId);

        // 同步首选车辆
        await syncPreferred(api, user);
        writeAuditEvent('vehicle_plate_swapped', {
          account: getAccountLabel(user),
          result: 'success',
          old_plate: oldPlate,
          new_plate: newPlate,
        });

        output(success(
          { oldPlate, newPlate },
          `换牌成功: ${oldPlate} → ${newPlate}`,
        ));
      } catch (err) {
        writeAuditEvent(
          'vehicle_plate_swapped',
          {
            account: options.account || null,
            error: err.message,
            new_plate: newPlate,
            old_plate: options.from || null,
            result: 'failure',
          },
          { level: 'error' },
        );
        output(error(`换牌失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  vehicle
    .command('set <plate>')
    .description('设置首选车辆')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (plate, options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          throw new Error(`尚未初始化，请先运行 ${COMMAND_NAME} init`);
        }
        updateUser({ preferred_vehicle: plate }, user.bjt_phone);
        writeAuditEvent('preferred_vehicle_changed', {
          account: getAccountLabel(user),
          result: 'success',
          plate,
        });
        output(success({ preferred_vehicle: plate }, `首选车辆已设置为: ${plate}`));
      } catch (err) {
        writeAuditEvent(
          'preferred_vehicle_changed',
          {
            account: options.account || null,
            error: err.message,
            plate,
            result: 'failure',
          },
          { level: 'error' },
        );
        output(error(`设置首选车辆失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
