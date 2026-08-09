import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { COMMAND_NAME, CONFIG_DIR, CONFIG_FILE } from '../constants.js';

const LEGACY_CONFIG_DIRS = ['.cross-bj-next', '.cross-bj'];

export function migrateLegacyConfigDir(
  targetDir,
  legacyDirs = LEGACY_CONFIG_DIRS.map((dir) => join(homedir(), dir)),
) {
  if (existsSync(targetDir)) return null;
  const sourceDir = legacyDirs.find((dir) => existsSync(dir));
  if (!sourceDir) return null;
  cpSync(sourceDir, targetDir, { recursive: true, errorOnExist: true });
  chmodSync(targetDir, 0o700);
  return sourceDir;
}

/**
 * Returns the config directory path: ~/.auto-bj-pass/
 */
export function getConfigDir() {
  const explicitDir =
    process.env.AUTO_BJ_PASS_CONFIG_DIR ||
    process.env.CROSS_BJ_CONFIG_DIR;
  if (explicitDir) return explicitDir;

  const targetDir = join(homedir(), CONFIG_DIR);
  migrateLegacyConfigDir(targetDir);
  return targetDir;
}

/**
 * Returns the config file path: ~/.auto-bj-pass/config.json
 */
export function getConfigPath() {
  return join(getConfigDir(), CONFIG_FILE);
}

/**
 * Creates the config directory if it doesn't exist.
 */
export function ensureConfigDir() {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  chmodSync(dir, 0o700);
}

/**
 * Reads and parses config.json. Returns null if the file doesn't exist.
 */
export function loadConfig() {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return null;
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Writes config object to config.json (ensures dir exists first).
 */
export function saveConfig(config) {
  ensureConfigDir();
  const configPath = getConfigPath();
  const temporaryPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify(config, null, 4), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    chmodSync(temporaryPath, 0o600);
    renameSync(temporaryPath, configPath);
    chmodSync(configPath, 0o600);
  } catch (error) {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
}

/**
 * Returns configured users. `initializedOnly` filters out entries without auth.
 */
export function getUsers({ initializedOnly = false } = {}) {
  const config = loadConfig();
  const users = Array.isArray(config?.users) ? config.users : [];
  return initializedOnly
    ? users.filter((user) => typeof user.auth === 'string' && user.auth.length > 0)
    : users;
}

/**
 * Human-readable account label used in command output.
 */
export function getAccountLabel(user, index = null) {
  if (user?.name?.trim()) return user.name.trim();
  if (user?.bjt_phone) {
    return user.bjt_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return index === null ? '未命名账号' : `账号${index + 1}`;
}

/**
 * Resolves an account by exact name, phone number, or 1-based index.
 */
export function resolveUser(users, selector) {
  if (!Array.isArray(users) || users.length === 0) return null;
  if (selector === undefined || selector === null || selector === '') {
    return users[0];
  }

  const value = String(selector).trim();
  const matches = users.filter(
    (user, index) =>
      String(index + 1) === value ||
      user.name?.trim() === value ||
      user.bjt_phone === value,
  );
  if (matches.length === 0) {
    throw new Error(`未找到账号: ${value}`);
  }
  if (matches.length > 1) {
    throw new Error(`账号选择不唯一: ${value}，请使用手机号或序号`);
  }
  return matches[0];
}

/**
 * Returns the first user for backwards compatibility, or the selected user.
 */
export function getUser(selector) {
  return resolveUser(getUsers(), selector);
}

/**
 * Read commands process all initialized accounts by default.
 */
export function getSelectedUsers(selector) {
  const users = getUsers({ initializedOnly: true });
  if (selector) {
    const allUsers = getUsers();
    const user = resolveUser(allUsers, selector);
    if (!user?.auth) {
      throw new Error(`账号 ${getAccountLabel(user)} 尚未完成登录初始化`);
    }
    return [user];
  }
  return users;
}

/**
 * Mutating commands must select an account when more than one is configured.
 */
export function getMutationUser(selector) {
  const allUsers = getUsers();
  if (selector) {
    const user = resolveUser(allUsers, selector);
    if (!user?.auth) {
      throw new Error(`账号 ${getAccountLabel(user)} 尚未完成登录初始化`);
    }
    return user;
  }

  const initializedUsers = allUsers.filter(
    (user) => typeof user.auth === 'string' && user.auth.length > 0,
  );
  if (initializedUsers.length === 0) return null;
  if (initializedUsers.length > 1) {
    throw new Error('已配置多个账号，请使用 --account <名称|手机号|序号> 指定账号');
  }
  return initializedUsers[0];
}

/**
 * Adds a user, or replaces the user with the same phone number when requested.
 */
export function upsertUser(user, { replace = false } = {}) {
  const config = loadConfig() || { users: [] };
  if (!Array.isArray(config.users)) config.users = [];

  const index = config.users.findIndex(
    (candidate) => candidate.bjt_phone === user.bjt_phone,
  );
  if (index >= 0 && !replace) {
    throw new Error('该手机号已存在，使用 --force 更新该账号');
  }
  if (index >= 0) {
    config.users[index] = { ...config.users[index], ...user };
  } else {
    config.users.push(user);
  }
  saveConfig(config);
  return index >= 0 ? index : config.users.length - 1;
}

/**
 * Merges updates into a selected user and saves the config.
 */
export function updateUser(updates, selector) {
  const config = loadConfig();
  if (!config || !Array.isArray(config.users) || config.users.length === 0) {
    throw new Error(`尚未初始化，请先运行 ${COMMAND_NAME} init`);
  }
  if (!selector && config.users.length > 1) {
    throw new Error('已配置多个账号，请指定要更新的账号');
  }
  const user = resolveUser(config.users, selector);
  Object.assign(user, updates);
  saveConfig(config);
  return user;
}

export function removeUser(selector) {
  const config = loadConfig();
  if (!config || !Array.isArray(config.users) || config.users.length === 0) {
    throw new Error(`尚未初始化，请先运行 ${COMMAND_NAME} init`);
  }
  const user = resolveUser(config.users, selector);
  config.users = config.users.filter((candidate) => candidate !== user);
  saveConfig(config);
  return user;
}

/**
 * Returns true if at least one account, or the selected account, is initialized.
 */
export function isInitialized(selector) {
  if (selector) {
    const user = getUser(selector);
    return Boolean(user?.auth);
  }
  return getUsers({ initializedOnly: true }).length > 0;
}
