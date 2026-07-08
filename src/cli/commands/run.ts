import type { Command } from 'commander';
import { SchedulerService } from '../../scheduler/scheduler-service.js';
import { LockService } from '../../scheduler/lock-service.js';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerRunCommands(program: Command): void {
  program
    .command('status')
    .description('Query permit status')
    .argument('<account>')
    .action(async (account) => {
      const { services } = createCliContext();
      const result = await services.permitService.status(account);
      printResult({ ok: true, message: '状态查询完成', data: result.state });
    });

  program
    .command('run')
    .description('Run permit check/application')
    .option('--account <account>', 'Account name')
    .option('--plate <plate>', 'Plate number')
    .action(async (options) => {
      if (!options.account) {
        printResult({ ok: false, message: '缺少 --account <account>' });
        process.exitCode = 1;
        return;
      }
      const { services } = createCliContext();
      const result = await services.permitService.run(options.account, { plate: options.plate });
      printResult({ ok: true, message: result.message, data: result });
    });

  program
    .command('scheduler')
    .description('Scheduler utilities')
    .command('tick')
    .description('Run due scheduled accounts')
    .action(async () => {
      const { repos, services } = createCliContext();
      const scheduler = new SchedulerService(
        repos.schedulesRepo,
        new LockService(),
        async (accountId) => {
          const accounts = await repos.accountsRepo.list();
          const account = accounts.find((item) => item.id === accountId);
          if (!account) throw new Error(`账号不存在: ${accountId}`);
          await services.permitService.run(account.name, { triggerType: 'scheduled' });
        },
      );
      const result = await scheduler.tick();
      printResult({ ok: true, message: '调度检查完成', data: result });
    });
}
