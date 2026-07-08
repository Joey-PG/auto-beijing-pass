import type { Command } from 'commander';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerAuditCommands(program: Command): void {
  program
    .command('audit')
    .description('Show audit logs')
    .command('list')
    .option('--limit <limit>', 'Number of rows', '50')
    .action(async (options) => {
      const { repos } = createCliContext();
      const logs = await repos.auditRepo.listRecent(Number(options.limit));
      printResult({ ok: true, message: `共 ${logs.length} 条审计日志`, data: logs });
    });
}
