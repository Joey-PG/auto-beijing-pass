import type { Command } from 'commander';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerJobsCommands(program: Command): void {
  program
    .command('jobs')
    .description('Show recent job runs')
    .command('list')
    .option('--limit <limit>', 'Number of rows', '20')
    .action(async (options) => {
      const { repos } = createCliContext();
      const jobs = await repos.jobsRepo.listRecent(Number(options.limit));
      printResult({ ok: true, message: `共 ${jobs.length} 条执行记录`, data: jobs });
    });
}
