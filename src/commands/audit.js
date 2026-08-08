import {
  formatAuditEvent,
  getLogDir,
  readAuditEvents,
  writeAuditEvent,
} from '../lib/audit-logger.js';
import { output, success, error } from '../output.js';

export function registerAuditCommand(program) {
  program
    .command('audit')
    .description('查询本机结构化审计日志')
    .option('--since <time>', '起始时间，如 7d 或 2026-07-01', '30d')
    .option('--account <account>', '按账号名称或手机号筛选')
    .option('--event <event>', '按事件名称筛选')
    .option('--limit <count>', '最多显示条数', '100')
    .option('--json', '输出 JSON')
    .action((options) => {
      try {
        const rows = readAuditEvents({
          since: options.since,
          account: options.account,
          event: options.event,
          limit: options.limit,
        });
        writeAuditEvent('audit_queried', {
          result: 'success',
          count: rows.length,
          filters: {
            since: options.since,
            account: options.account || null,
            event: options.event || null,
          },
        });
        if (options.json) {
          console.log(JSON.stringify(rows, null, 2));
          return;
        }
        const message =
          rows.length > 0
            ? rows.map(formatAuditEvent).join('\n')
            : `未找到符合条件的审计记录\n日志目录: ${getLogDir()}`;
        output(success(rows, message));
      } catch (err) {
        writeAuditEvent(
          'audit_queried',
          { result: 'failure', error: err.message },
          { level: 'error' },
        );
        output(error(`查询审计日志失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}

