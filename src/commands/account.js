import {
  getAccountLabel,
  getUsers,
  removeUser,
} from '../lib/config-manager.js';
import { output, success, error } from '../output.js';
import { writeAuditEvent } from '../lib/audit-logger.js';
import { getMembershipInfo } from '../lib/membership.js';

export function registerAccountCommand(program) {
  const account = program.command('account').description('多账号管理');

  account
    .command('list')
    .description('查看已配置账号')
    .action(() => {
      try {
        const users = getUsers();
        if (users.length === 0) {
          output(success([], '尚未配置账号'));
          return;
        }
        const rows = users.map((user, index) => {
          const membership = getMembershipInfo(user);
          return {
            index: index + 1,
            name: getAccountLabel(user, index),
            phone: user.bjt_phone
              ? user.bjt_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
              : '',
            initialized: Boolean(user.auth),
            entryType: user.entry_type || '六环外',
            autoRenew: user.auto_renew !== false,
            membershipExpiresOn: membership.expiresOn,
            membershipStatus: membership.status,
          };
        });
        const message = rows
          .map(
            (row) =>
              `${row.index}. ${row.name} (${row.phone}) ` +
              `${row.initialized ? '已登录' : '未登录'} / ${row.entryType} / ` +
              `自动续签${row.autoRenew ? '开启' : '关闭'} / ` +
              `服务${row.membershipStatus === 'expired' ? '已到期' : '有效'}` +
              `${row.membershipExpiresOn ? `至 ${row.membershipExpiresOn}` : ''}`,
          )
          .join('\n');
        output(success(rows, message));
      } catch (err) {
        output(error(`查询账号失败: ${err.message}`));
        process.exitCode = 1;
      }
    });

  account
    .command('remove <account>')
    .description('删除指定账号配置（名称、手机号或序号）')
    .action((selector) => {
      try {
        const user = removeUser(selector);
        writeAuditEvent('account_removed', {
          account: getAccountLabel(user),
          phone: user.bjt_phone || null,
          result: 'success',
        });
        output(
          success(
            null,
            `账号已删除: ${getAccountLabel(user)}`,
          ),
        );
      } catch (err) {
        output(error(`删除账号失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
