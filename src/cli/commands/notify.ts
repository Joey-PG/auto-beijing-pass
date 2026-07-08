import type { Command } from 'commander';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerNotifyCommands(program: Command): void {
  const notify = program.command('notify').description('Manage notification channels');

  notify
    .command('add')
    .argument('<account>')
    .argument('<url>')
    .action(async (accountName, url) => {
      const { repos, services } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const channel = await services.notificationService.add(account.id, url);
      printResult({ ok: true, message: '通知渠道已添加', data: { id: channel.id, type: channel.type } });
    });

  notify
    .command('list')
    .argument('<account>')
    .action(async (accountName) => {
      const { repos, services } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const channels = await services.notificationService.list(account.id);
      printResult({ ok: true, message: `共 ${channels.length} 个通知渠道`, data: channels });
    });

  notify
    .command('remove')
    .argument('<id>')
    .action(async (id) => {
      const { repos } = createCliContext();
      await repos.notificationsRepo.remove(id);
      printResult({ ok: true, message: '通知渠道已删除' });
    });

  notify
    .command('test')
    .argument('<account>')
    .action(async (accountName) => {
      const { repos, services } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const result = await services.notificationService.test(account.id);
      printResult({ ok: true, message: '测试通知已执行', data: result.map((item) => item.status) });
    });
}
