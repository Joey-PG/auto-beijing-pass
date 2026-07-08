import { Command } from 'commander';
import { printResult } from '../output/result.js';

export function createProgram(): Command {
  const program = new Command();

  program.name('auto-bj').description('Multi-account Beijing entry permit CLI').version('0.1.0');

  program
    .command('doctor')
    .description('Check local configuration')
    .action(() => {
      printResult({ ok: true, message: 'auto-bj CLI is installed' });
    });

  return program;
}
