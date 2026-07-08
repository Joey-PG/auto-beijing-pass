import { Command } from 'commander';
import { registerAccountCommands } from './commands/account.js';
import { registerDbCommands } from './commands/db.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerScheduleCommands } from './commands/schedule.js';

export function createProgram(): Command {
  const program = new Command();

  program.name('auto-bj').description('Multi-account Beijing entry permit CLI').version('0.1.0');

  registerDoctorCommand(program);
  registerDbCommands(program);
  registerAccountCommands(program);
  registerScheduleCommands(program);

  return program;
}
