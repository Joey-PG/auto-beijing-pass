import type { Command } from 'commander';
import { loadEnv } from '../../config/env.js';
import { printResult } from '../../output/result.js';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Check local configuration')
    .action(() => {
      const env = loadEnv();
      printResult({
        ok: true,
        message: '配置检查通过',
        data: {
          databaseUrlConfigured: Boolean(env.databaseUrl),
          appSecretKeyBytes: env.appSecretKey.byteLength,
          timezone: env.timezone,
          logLevel: env.logLevel,
        },
      });
    });
}
