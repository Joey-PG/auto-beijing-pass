import pg from 'pg';
import type { Command } from 'commander';
import { loadEnv } from '../../config/env.js';
import { printResult } from '../../output/result.js';

export function registerDbCommands(program: Command): void {
  const db = program.command('db').description('Database utilities');

  db.command('status')
    .description('Check PostgreSQL connectivity')
    .action(async () => {
      const env = loadEnv();
      const pool = new pg.Pool({ connectionString: env.databaseUrl });
      try {
        await pool.query('select 1');
        printResult({ ok: true, message: '数据库连接正常' });
      } finally {
        await pool.end();
      }
    });

  db.command('migrate')
    .description('Show migration command')
    .action(() => {
      printResult({
        ok: true,
        message: '请运行: npx drizzle-kit push',
      });
    });
}
