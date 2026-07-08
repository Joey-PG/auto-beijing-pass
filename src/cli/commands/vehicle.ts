import type { Command } from 'commander';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerVehicleCommands(program: Command): void {
  const vehicle = program.command('vehicle').description('Manage account vehicles');

  vehicle
    .command('sync')
    .argument('<account>')
    .action(async (account) => {
      const { services } = createCliContext();
      const vehicles = await services.permitService.syncVehicles(account);
      printResult({ ok: true, message: `同步 ${vehicles.length} 辆车`, data: vehicles });
    });

  vehicle
    .command('list')
    .argument('<account>')
    .action(async (accountName) => {
      const { repos } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const vehicles = await repos.vehiclesRepo.listByAccount(account.id);
      printResult({ ok: true, message: `共 ${vehicles.length} 辆车`, data: vehicles });
    });

  vehicle
    .command('set-preferred')
    .argument('<account>')
    .argument('<plate>')
    .action(async (accountName, plate) => {
      const { repos } = createCliContext();
      const account = await repos.accountsRepo.findByName(accountName);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${accountName}` });
        process.exitCode = 1;
        return;
      }
      const updated = await repos.vehiclesRepo.setPreferred(account.id, plate);
      printResult({ ok: Boolean(updated), message: updated ? '首选车辆已更新' : '车辆不存在', data: updated });
    });
}
