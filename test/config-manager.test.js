import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  getMutationUser,
  getSelectedUsers,
  loadConfig,
  migrateLegacyConfigDir,
  removeUser,
  resolveUser,
  saveConfig,
  updateUser,
  upsertUser,
} from '../src/lib/config-manager.js';

function makeUser(name, phone, auth) {
  return {
    name,
    auth,
    bjt_phone: phone,
    bjt_pwd: 'not-a-real-password',
    entry_type: '六环外',
    notify_urls: [],
    preferred_vehicle: '',
  };
}

test('supports selecting, updating, and removing multiple accounts', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-config-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    const first = makeUser('家庭账号', '13800000001', 'token-1');
    const second = makeUser('工作账号', '13800000002', 'token-2');
    saveConfig({ users: [first, second] });

    assert.equal(getSelectedUsers().length, 2);
    assert.equal(getSelectedUsers('工作账号')[0].auth, 'token-2');
    assert.equal(resolveUser([first, second], '2'), second);
    assert.equal(resolveUser([first, second], '13800000001'), first);
    assert.throws(
      () => getMutationUser(),
      /已配置多个账号/,
    );

    updateUser({ entry_type: '六环内' }, '工作账号');
    assert.equal(
      loadConfig().users[1].entry_type,
      '六环内',
    );

    const removed = removeUser('1');
    assert.equal(removed.name, '家庭账号');
    assert.equal(loadConfig().users.length, 1);
    assert.equal(getMutationUser().name, '工作账号');

    const replacement = {
      ...second,
      name: '更新后的账号',
      auth: 'token-new',
    };
    upsertUser(replacement, { replace: true });
    assert.equal(loadConfig().users[0].name, '更新后的账号');
    assert.equal(loadConfig().users[0].auth, 'token-new');

    updateUser({ auto_renew: false }, '更新后的账号');
    assert.equal(loadConfig().users[0].auto_renew, false);

    const configPath = join(configDir, 'config.json');
    assert.equal(
      statSync(configPath).mode & 0o777,
      0o600,
    );
    assert.doesNotMatch(
      readFileSync(configPath, 'utf8'),
      /13811610582/,
    );
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('copies legacy config into the new directory without deleting the source', () => {
  const root = mkdtempSync(join(tmpdir(), 'auto-bj-pass-migration-'));
  const legacyDir = join(root, '.cross-bj-next');
  const targetDir = join(root, '.auto-bj-pass');
  mkdirSync(join(legacyDir, 'logs'), { recursive: true });
  writeFileSync(join(legacyDir, 'config.json'), '{"users":[]}');
  writeFileSync(join(legacyDir, 'logs', 'cron.log'), 'legacy log');

  try {
    assert.equal(
      migrateLegacyConfigDir(targetDir, [legacyDir]),
      legacyDir,
    );
    assert.equal(readFileSync(join(targetDir, 'config.json'), 'utf8'), '{"users":[]}');
    assert.equal(
      readFileSync(join(targetDir, 'logs', 'cron.log'), 'utf8'),
      'legacy log',
    );
    assert.equal(existsSync(join(legacyDir, 'config.json')), true);
    assert.equal(statSync(targetDir).mode & 0o777, 0o700);
    assert.equal(migrateLegacyConfigDir(targetDir, [legacyDir]), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
