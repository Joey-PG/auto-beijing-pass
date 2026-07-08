import type { Command } from 'commander';
import { computeNextRun } from '../../scheduler/scheduler-service.js';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerScheduleCommands(program: Command): void {
  const schedule = program.command('schedule').description('Manage account schedules');

  schedule
    .command('set')
    .description('Set an account cron schedule')
    .argument('<account>')
    .argument('<cron>')
    .option('--timezone <timezone>', 'Timezone', 'Asia/Shanghai')
    .action(async (accountName, cronExpr, options) => {
      const { repos } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const nextRunAt = computeNextRun(cronExpr, options.timezone, new Date());
      const saved = await repos.schedulesRepo.upsert({
        accountId: account.id,
        cronExpr,
        timezone: options.timezone,
        enabled: true,
        nextRunAt,
      });
      printResult({ ok: true, message: '调度已保存', data: saved });
    });

  schedule
    .command('list')
    .description('List due schedule records is not supported; use db tools for full inspection')
    .action(() => {
      printResult({
        ok: true,
        message: 'schedule list will be expanded after repository pagination is added',
      });
    });

  schedule
    .command('enable')
    .argument('<account>')
    .action(async (accountName) => setScheduleEnabled(accountName, true));

  schedule
    .command('disable')
    .argument('<account>')
    .action(async (accountName) => setScheduleEnabled(accountName, false));
}

async function setScheduleEnabled(accountName: string, enabled: boolean): Promise<void> {
  const { repos } = createCliContext();
  const account = await repos.accountsRepo.findByName(accountName);
  if (!account) {
    printResult({ ok: false, message: `账号不存在: ${accountName}` });
    process.exitCode = 1;
    return;
  }
  await repos.schedulesRepo.setEnabled(account.id, enabled);
  printResult({ ok: true, message: enabled ? '调度已启用' : '调度已停用' });
}
