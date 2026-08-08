#!/usr/bin/env node

import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { program } from 'commander';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

process.env.AUTO_BJ_PASS_VERSION ||= process.env.CROSS_BJ_VERSION || version;
process.env.AUTO_BJ_PASS_RUN_ID ||=
  process.env.CROSS_BJ_RUN_ID || randomUUID();

program
  .name(process.env.AUTO_BJ_PASS_COMMAND_NAME || 'auto-bj-pass')
  .description('进京证 CLI 工具 - 办理/续签进京证、管理车辆、配置通知')
  .version(version);

import { registerInitCommand } from '../src/commands/init.js';
import { registerStatusCommand } from '../src/commands/status.js';
import { registerRunCommand } from '../src/commands/run.js';
import { registerVehicleCommand } from '../src/commands/vehicle.js';
import { registerNotifyCommand } from '../src/commands/notify.js';
import { registerSetCommand } from '../src/commands/set.js';
import { registerCronCommand } from '../src/commands/cron.js';
import { registerAccountCommand } from '../src/commands/account.js';
import { registerTripCommand } from '../src/commands/trip.js';
import { registerAuditCommand } from '../src/commands/audit.js';
import { registerWebCommand } from '../src/commands/web.js';

registerInitCommand(program);
registerStatusCommand(program);
registerRunCommand(program);
registerVehicleCommand(program);
registerNotifyCommand(program);
registerSetCommand(program);
registerCronCommand(program);
registerAccountCommand(program);
registerTripCommand(program);
registerAuditCommand(program);
registerWebCommand(program);

program.action(async () => {
  const { runCommand } = await import('../src/commands/run.js');
  await runCommand();
});

await program.parseAsync();
