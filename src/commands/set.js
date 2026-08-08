import {
  getAccountLabel,
  getMutationUser,
  updateUser,
} from '../lib/config-manager.js';
import { output, success, error } from '../output.js';
import { COMMAND_NAME } from '../constants.js';
import { writeAuditEvent } from '../lib/audit-logger.js';

const VALID_KEYS = {
  'entry-type': {
    configKey: 'entry_type',
    validValues: ['六环内', '六环外'],
    description: '进京证类型',
    transform: (value) => value,
  },
  'auto-renew': {
    configKey: 'auto_renew',
    validValues: ['on', 'off'],
    description: '自动续签',
    transform: (value) => value === 'on',
  },
};

export function registerSetCommand(program) {
  program
    .command('set <key> <value>')
    .description('修改配置项（支持: entry-type, auto-renew）')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (key, value, options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          writeAuditEvent(
            'config_changed',
            {
              account: options.account || null,
              error: `尚未初始化，请先运行 ${COMMAND_NAME} init`,
              key,
              result: 'failure',
            },
            { level: 'error' },
          );
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }

        const keyDef = VALID_KEYS[key];
        if (!keyDef) {
          const validKeys = Object.keys(VALID_KEYS).join(', ');
          writeAuditEvent(
            'config_changed',
            {
              account: getAccountLabel(user),
              error: `不支持的配置项: ${key}`,
              key,
              result: 'failure',
            },
            { level: 'error' },
          );
          output(error(`不支持的配置项: ${key}，支持的配置项: ${validKeys}`));
          process.exitCode = 1;
          return;
        }

        if (!keyDef.validValues.includes(value)) {
          writeAuditEvent(
            'config_changed',
            {
              account: getAccountLabel(user),
              error: `无效的值: ${value}`,
              key,
              result: 'failure',
            },
            { level: 'error' },
          );
          output(error(`无效的值: ${value}，${keyDef.description}必须是: ${keyDef.validValues.join(' 或 ')}`));
          process.exitCode = 1;
          return;
        }

        const previousValue = user[keyDef.configKey];
        updateUser(
          { [keyDef.configKey]: keyDef.transform(value) },
          user.bjt_phone,
        );
        const displayValue =
          key === 'auto-renew'
            ? value === 'on'
              ? '开启'
              : '关闭'
            : value;
        output(
          success(
            { key, value },
            `${keyDef.description}已设置为: ${displayValue}`,
          ),
        );
        writeAuditEvent('config_changed', {
          account: getAccountLabel(user),
          result: 'success',
          key,
          previous_value: previousValue ?? null,
          new_value: keyDef.transform(value),
        });
      } catch (err) {
        writeAuditEvent(
          'config_changed',
          {
            account: options.account || null,
            error: err.message,
            key,
            result: 'failure',
          },
          { level: 'error' },
        );
        output(error(`设置失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
