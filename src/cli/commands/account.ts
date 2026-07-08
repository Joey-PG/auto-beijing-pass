import { input, password, select } from '@inquirer/prompts';
import type { Command } from 'commander';
import { printResult } from '../../output/result.js';
import { createCliContext } from '../context.js';

export function registerAccountCommands(program: Command): void {
  const account = program.command('account').description('Manage Beijing Tong accounts');

  account
    .command('add')
    .description('Add a Beijing Tong account')
    .option('--name <name>', 'Account alias')
    .option('--phone <phone>', 'Beijing Tong phone number')
    .option('--password <password>', 'Beijing Tong password; prefer interactive input')
    .option('--entry-type <type>', 'Default entry permit type', '六环内')
    .action(async (options) => {
      const name = options.name || (await input({ message: '账号别名:' }));
      const phone = options.phone || (await input({ message: '北京通手机号:' }));
      const rawPassword =
        options.password ||
        (await password({ message: '北京通密码:', mask: '*', validate: required('密码不能为空') }));
      const defaultEntryType =
        options.entryType ||
        (await select({
          message: '默认进京证类型:',
          choices: [{ value: '六环内' }, { value: '六环外' }],
          default: '六环内',
        }));

      const { services } = createCliContext();
      const created = await services.accountService.add({
        name,
        phone,
        password: rawPassword,
        defaultEntryType,
      });
      printResult({ ok: true, message: '账号已添加', data: publicAccount(created) });
    });

  account
    .command('list')
    .description('List accounts')
    .action(async () => {
      const { services } = createCliContext();
      const accounts = await services.accountService.list();
      printResult({ ok: true, message: `共 ${accounts.length} 个账号`, data: accounts.map(publicAccount) });
    });

  account
    .command('show')
    .description('Show one account')
    .argument('<name>')
    .action(async (name) => {
      const { services } = createCliContext();
      const account = await services.accountService.show(name);
      if (!account) {
        printResult({ ok: false, message: `账号不存在: ${name}` });
        process.exitCode = 1;
        return;
      }
      printResult({ ok: true, message: '账号详情', data: publicAccount(account) });
    });

  account
    .command('enable')
    .description('Enable an account')
    .argument('<name>')
    .action(async (name) => {
      const { services } = createCliContext();
      const account = await services.accountService.setEnabled(name, true);
      printAccountMutation(account, name, '账号已启用');
    });

  account
    .command('disable')
    .description('Disable an account')
    .argument('<name>')
    .action(async (name) => {
      const { services } = createCliContext();
      const account = await services.accountService.setEnabled(name, false);
      printAccountMutation(account, name, '账号已停用');
    });

  account
    .command('update-password')
    .description('Update Beijing Tong password')
    .argument('<name>')
    .action(async (name) => {
      const rawPassword = await password({
        message: '新的北京通密码:',
        mask: '*',
        validate: required('密码不能为空'),
      });
      const { services } = createCliContext();
      const account = await services.accountService.updatePassword(name, rawPassword);
      printAccountMutation(account, name, '密码已更新');
    });
}

function publicAccount(account: {
  id: string;
  name: string;
  phone: string;
  defaultEntryType: string;
  preferredPlate: string | null;
  enabled: boolean;
  needsPasswordUpdate: boolean;
}) {
  return {
    id: account.id,
    name: account.name,
    phone: account.phone,
    defaultEntryType: account.defaultEntryType,
    preferredPlate: account.preferredPlate,
    enabled: account.enabled,
    needsPasswordUpdate: account.needsPasswordUpdate,
  };
}

function printAccountMutation(
  account: ReturnType<typeof publicAccount> | null,
  name: string,
  message: string,
): void {
  if (!account) {
    printResult({ ok: false, message: `账号不存在: ${name}` });
    process.exitCode = 1;
    return;
  }
  printResult({ ok: true, message, data: publicAccount(account) });
}

function required(message: string) {
  return (value: string) => value.length > 0 || message;
}
