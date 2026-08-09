import { login } from '../lib/bjt-login.js';
import { getUsers, upsertUser } from '../lib/config-manager.js';
import { output, success, error } from '../output.js';
import { writeAuditEvent } from '../lib/audit-logger.js';
import { createMembership } from '../lib/membership.js';
import { readFileSync } from 'node:fs';

export const DEFAULT_ENTRY_TYPE = '六环外';

export function resolveAccountName(name, existingUser, phone) {
  return name?.trim() || existingUser?.name?.trim() || phone;
}

export function resolveEntryType(requestedEntryType, existingUser) {
  return (
    requestedEntryType ||
    existingUser?.entry_type ||
    DEFAULT_ENTRY_TYPE
  );
}

export function resolveNotifyUrls(requestedUrls, existingUser) {
  return requestedUrls === undefined
    ? existingUser?.notify_urls || []
    : requestedUrls;
}

export function readPasswordFromStdin() {
  if (process.stdin.isTTY) {
    throw new Error('--password-stdin 需要从标准输入管道读取密码');
  }
  return readFileSync(0, 'utf8').replace(/\r?\n$/, '');
}

export function registerInitCommand(program) {
  program
    .command('init')
    .description('添加或更新账号（无参数=交互式，有参数=非交互式）')
    .option('--name <name>', '账号名称（用于多账号选择）')
    .option('--phone <phone>', '北京通手机号')
    .option('--password-stdin', '从标准输入读取北京通密码（避免出现在进程参数中）')
    .option('--entry-type <type>', '进京证类型（六环内/六环外，默认六环外）')
    .option('--notify <urls...>', '通知渠道URL')
    .option('-f, --force', '更新相同手机号的已有账号')
    .action(async (options) => {
      try {
        const isInteractive = !(options.phone && options.passwordStdin);

        let name, phone, password, entryType, notifyUrls, existingUser;
        const existingUsers = getUsers();

        if (!isInteractive) {
          // Non-interactive mode
          name = options.name;
          phone = options.phone;
          password = readPasswordFromStdin();
          existingUser = existingUsers.find(
            (user) => user.bjt_phone === phone,
          );
          entryType = resolveEntryType(options.entryType, existingUser);
          notifyUrls = resolveNotifyUrls(options.notify, existingUser);
        } else {
          // Interactive mode
          const { input, password: passwordPrompt, select } = await import('@inquirer/prompts');
          name =
            options.name ??
            await input({
              message: '账号名称（可留空，默认使用手机号）:',
            });
          phone =
            options.phone ??
            await input({
              message: '请输入北京通手机号:',
              validate: (v) => v.length > 0 || '手机号不能为空',
            });
          existingUser = existingUsers.find(
            (user) => user.bjt_phone === phone,
          );
          password =
            await passwordPrompt({
              message: '请输入北京通密码:',
              mask: '*',
              validate: (v) => v.length > 0 || '密码不能为空',
            });
          entryType = await select({
            message: '请选择进京证类型:',
            choices: [{ value: '六环外' }, { value: '六环内' }],
            default: resolveEntryType(options.entryType, existingUser),
          });
          const notifyInput = await input({
            message: existingUser
              ? '通知渠道URL（多个用逗号分隔，留空保留原配置）:'
              : '通知渠道URL（多个用逗号分隔，可留空）:',
          });
          notifyUrls = notifyInput
            ? notifyInput.split(',').map((u) => u.trim()).filter(Boolean)
            : resolveNotifyUrls(undefined, existingUser);
        }

        let replace = options.force;
        if (existingUser && isInteractive && !replace) {
          const { confirm } = await import('@inquirer/prompts');
          replace = await confirm({
            message: '该手机号已存在，是否更新登录信息？',
            default: false,
          });
          if (!replace) {
            output(success(null, '已取消'));
            return;
          }
        }
        if (existingUser && !replace) {
          output(error('该手机号已存在，使用 -f/--force 更新该账号'));
          process.exitCode = 1;
          return;
        }

        // Validate entry type
        if (entryType !== '六环内' && entryType !== '六环外') {
          output(error(`无效的进京证类型: ${entryType}，必须是 六环内 或 六环外`));
          process.exitCode = 1;
          return;
        }

        // Login to get token
        output(success(null, '正在登录北京通...'));
        const token = await login(phone, password);

        const accountName = resolveAccountName(
          name,
          existingUser,
          phone,
        );
        const user = {
          name: accountName,
          auth: token,
          bjt_phone: phone,
          bjt_pwd: password,
          entry_type: entryType,
          notify_urls: notifyUrls,
          preferred_vehicle: existingUser?.preferred_vehicle || '',
          auto_renew: existingUser?.auto_renew ?? true,
          ...(existingUser
            ? {
                membership_started_on: existingUser.membership_started_on,
                membership_expires_on: existingUser.membership_expires_on,
                membership_permanent: existingUser.membership_permanent === true,
              }
            : createMembership()),
        };
        upsertUser(user, { replace });
        writeAuditEvent(
          existingUser ? 'account_updated' : 'account_initialized',
          {
            account: accountName,
            phone,
            result: 'success',
            entry_type: entryType,
            auto_renew: user.auto_renew,
            notification_channel_count: notifyUrls.length,
          },
        );
        output(
          success(
            { name: accountName, phone, entryType },
            `账号 ${accountName} 初始化成功！配置已保存。`,
          ),
        );
      } catch (err) {
        output(error(`初始化失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
