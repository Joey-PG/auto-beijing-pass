import { Command } from 'commander';
import { registerAccountCommands } from './commands/account.js';
import { registerAuditCommands } from './commands/audit.js';
import { registerDbCommands } from './commands/db.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerJobsCommands } from './commands/jobs.js';
import { registerNotifyCommands } from './commands/notify.js';
import { registerRunCommands } from './commands/run.js';
import { registerScheduleCommands } from './commands/schedule.js';
import { registerVehicleCommands } from './commands/vehicle.js';

export function createProgram(): Command {
  const program = new Command();

  program.name('auto-bj').description('Multi-account Beijing entry permit CLI').version('0.1.0');

  registerDoctorCommand(program);
  registerDbCommands(program);
  registerAccountCommands(program);
  registerScheduleCommands(program);
  registerRunCommands(program);
  registerVehicleCommands(program);
  registerNotifyCommands(program);
  registerJobsCommands(program);
  registerAuditCommands(program);

  return program;
}
