import {
  getAccountLabel,
  getMutationUser,
  updateUser,
} from '../lib/config-manager.js';
import { testNotify } from '../lib/notifier.js';
import { writeAuditEvent } from '../lib/audit-logger.js';
import { output, success, error } from '../output.js';
import { COMMAND_NAME } from '../constants.js';

export function registerNotifyCommand(program) {
  const notify = program.command('notify').description('通知渠道管理');

  notify
    .command('add <url>')
    .description('添加通知渠道')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (url, options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }

        const urls = user.notify_urls || [];

        if (urls.includes(url)) {
          output(success({ notify_urls: urls }, '该通知渠道已存在'));
          return;
        }

        urls.push(url);
        updateUser({ notify_urls: urls }, user.bjt_phone);
        writeAuditEvent('notification_channel_added', {
          account: getAccountLabel(user),
          result: 'success',
          channel: url.split('://', 1)[0] || 'unknown',
          channel_count: urls.length,
        });
        output(success({ notify_urls: urls }, `通知渠道已添加: ${url}`));
      } catch (err) {
        output(error(`添加通知渠道失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  notify
    .command('remove <url>')
    .description('移除通知渠道')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (url, options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }

        const urls = (user.notify_urls || []).filter((u) => u !== url);
        updateUser({ notify_urls: urls }, user.bjt_phone);
        writeAuditEvent('notification_channel_removed', {
          account: getAccountLabel(user),
          result: 'success',
          channel: url.split('://', 1)[0] || 'unknown',
          channel_count: urls.length,
        });
        output(success({ notify_urls: urls }, `通知渠道已移除: ${url}`));
      } catch (err) {
        output(error(`移除通知渠道失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  notify
    .command('test')
    .description('发送测试通知')
    .option('--account <account>', '指定账号名称、手机号或序号')
    .action(async (options) => {
      try {
        const user = getMutationUser(options.account);
        if (!user) {
          output(error(`尚未初始化，请先运行 ${COMMAND_NAME} init`));
          process.exitCode = 1;
          return;
        }

        const urls = user.notify_urls || [];

        if (urls.length === 0) {
          output(
            error(
              `未配置通知渠道，请先运行 ${COMMAND_NAME} notify add <url>`,
            ),
          );
          process.exitCode = 1;
          return;
        }

        const results = await testNotify(urls);
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        writeAuditEvent('notification_tested', {
          account: getAccountLabel(user),
          result: failed === 0 ? 'success' : 'partial_failure',
          succeeded,
          failed,
          total: urls.length,
        });

        output(
          success(
            { succeeded, failed, total: urls.length },
            `测试通知已发送: ${succeeded} 成功, ${failed} 失败 (共 ${urls.length} 个渠道)`,
          ),
        );
      } catch (err) {
        output(error(`测试通知失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
