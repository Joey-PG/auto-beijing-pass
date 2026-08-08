import { writeAuditEvent } from '../lib/audit-logger.js';
import { error, output, success } from '../output.js';
import { startDashboardServer } from '../web/server.js';

export function registerWebCommand(program) {
  program
    .command('web')
    .description('启动无数据库的车辆续签管理后台')
    .option('--host <host>', '监听地址', '127.0.0.1')
    .option('--port <port>', '监听端口', '3751')
    .action(async (options) => {
      try {
        const port = Number(options.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('端口必须是 1 到 65535 之间的整数');
        }
        await startDashboardServer({ host: options.host, port });
        writeAuditEvent('web_started', {
          result: 'success',
          host: options.host,
          port,
          source: 'web',
        });
        output(
          success(
            { host: options.host, port },
            `管理后台已启动: http://${options.host}:${port}`,
          ),
        );
      } catch (err) {
        output(error(`管理后台启动失败: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
