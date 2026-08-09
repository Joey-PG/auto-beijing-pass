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
  getSystemDefaultTripProfile,
  getMutationUser,
  getSelectedUsers,
  loadConfig,
  migrateLegacyConfigDir,
  removeUser,
  resolveUser,
  saveConfig,
  setSystemDefaultTripProfile,
  updateUser,
  upsertUser,
} from '../src/lib/config-manager.js';
import {
  createTripProfile,
  DEFAULT_TRIP_PROFILE,
  resolveUserTripProfile,
} from '../src/lib/trip-profile.js';

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

test('persists one system trip profile without copying it into accounts', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-default-trip-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;

  try {
    saveConfig({ users: [makeUser('默认账号', '13800000001', 'token')] });
    assert.equal(getSystemDefaultTripProfile(), DEFAULT_TRIP_PROFILE);

    const profile = createTripProfile({
      inBeijingAddress: '管理员设置的在京地址',
      inBeijingLongitude: '116.40',
      inBeijingLatitude: '39.90',
      destinationAddress: '管理员设置的目的地',
      destinationLongitude: '116.41',
      destinationLatitude: '39.91',
      destinationArea: '朝阳区',
      districtCode: '003',
      purposeName: '其它',
      purposeCode: '06',
    });
    setSystemDefaultTripProfile(profile);

    const config = loadConfig();
    assert.equal(
      getSystemDefaultTripProfile().destination.address,
      '管理员设置的目的地',
    );
    assert.equal(
      resolveUserTripProfile(
        { trip_profile_mode: 'default' },
        getSystemDefaultTripProfile(),
      ).destination.address,
      '管理员设置的目的地',
    );
    assert.equal(config.users[0].trip_profile, undefined);
    assert.equal(config.default_trip_profile.destination.area, '朝阳区');
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

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
    const storedConfig = readFileSync(configPath, 'utf8');
    assert.equal(
      statSync(configPath).mode & 0o777,
      0o600,
    );
    assert.doesNotMatch(
      storedConfig,
      /token-1|token-2|token-new|not-a-real-password/,
    );
    assert.match(storedConfig, /auth_encrypted/);
    assert.equal(statSync(join(configDir, 'credentials.key')).mode & 0o777, 0o600);
  } finally {
    delete process.env.AUTO_BJ_PASS_CONFIG_DIR;
    rmSync(configDir, { recursive: true, force: true });
  }
});

test('migrates plaintext tokens and stored passwords without losing access', () => {
  const configDir = mkdtempSync(join(tmpdir(), 'auto-bj-pass-credential-migration-'));
  process.env.AUTO_BJ_PASS_CONFIG_DIR = configDir;
  const configPath = join(configDir, 'config.json');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify({
    users: [{
      name: '旧账号',
      auth: 'legacy-token',
      bjt_phone: '13800000006',
      bjt_pwd: 'legacy-password',
      membership_permanent: true,
    }],
  }));

  try {
    const [user] = loadConfig().users;
    assert.equal(user.auth, 'legacy-token');
    assert.equal(Object.hasOwn(user, 'bjt_pwd'), false);
    const storedConfig = readFileSync(configPath, 'utf8');
    assert.doesNotMatch(storedConfig, /legacy-token|legacy-password/);
    assert.match(storedConfig, /auth_encrypted/);
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
