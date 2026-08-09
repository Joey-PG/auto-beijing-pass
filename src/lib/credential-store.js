import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import {
  chmodSync,
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const KEY_FILE = 'credentials.key';
const PREFIX = 'v1';

function parseEnvironmentKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      'AUTO_BJ_PASS_CREDENTIAL_KEY 必须是 32 字节密钥（64 位十六进制或 Base64）',
    );
  }
  return key;
}

function readOrCreateKey(configDir) {
  const environmentKey = parseEnvironmentKey(
    process.env.AUTO_BJ_PASS_CREDENTIAL_KEY,
  );
  if (environmentKey) return environmentKey;

  mkdirSync(configDir, { recursive: true, mode: 0o700 });
  const keyPath = join(configDir, KEY_FILE);
  try {
    const existing = Buffer.from(readFileSync(keyPath, 'utf8').trim(), 'base64');
    if (existing.length !== KEY_BYTES) {
      throw new Error(`凭据密钥文件无效: ${keyPath}`);
    }
    chmodSync(keyPath, 0o600);
    return existing;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const key = randomBytes(KEY_BYTES);
  let descriptor;
  try {
    descriptor = openSync(keyPath, 'wx', 0o600);
    writeFileSync(descriptor, key.toString('base64'), 'utf8');
    closeSync(descriptor);
    descriptor = undefined;
    chmodSync(keyPath, 0o600);
    return key;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (error?.code !== 'EEXIST') throw error;
    const existing = Buffer.from(readFileSync(keyPath, 'utf8').trim(), 'base64');
    if (existing.length !== KEY_BYTES) {
      throw new Error(`凭据密钥文件无效: ${keyPath}`);
    }
    chmodSync(keyPath, 0o600);
    return existing;
  }
}

function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);
  return [
    PREFIX,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

function decrypt(value, key) {
  const [prefix, iv, tag, ciphertext, extra] = String(value || '').split(':');
  if (prefix !== PREFIX || !iv || !tag || !ciphertext || extra !== undefined) {
    throw new Error('配置中的加密凭据格式无效');
  }
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error(
      '无法解密业务凭据，请确认 credentials.key 或 AUTO_BJ_PASS_CREDENTIAL_KEY 未变更',
    );
  }
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

export function protectConfig(config, configDir) {
  const protectedConfig = cloneConfig(config);
  const users = Array.isArray(protectedConfig?.users)
    ? protectedConfig.users
    : [];
  const hasCredentials = users.some(
    (user) =>
      (typeof user.auth === 'string' && user.auth) ||
      (typeof user.bjt_pwd === 'string' && user.bjt_pwd),
  );
  const key = hasCredentials ? readOrCreateKey(configDir) : null;
  for (const user of users) {
    if (typeof user.auth === 'string' && user.auth) {
      user.auth_encrypted = encrypt(user.auth, key);
    }
    if (typeof user.bjt_pwd === 'string' && user.bjt_pwd) {
      user.bjt_pwd_encrypted = encrypt(user.bjt_pwd, key);
    }
    delete user.auth;
    delete user.bjt_pwd;
  }
  return protectedConfig;
}

export function unprotectConfig(config, configDir) {
  const unprotectedConfig = cloneConfig(config);
  const users = Array.isArray(unprotectedConfig?.users)
    ? unprotectedConfig.users
    : [];
  const hasEncryptedCredentials = users.some(
    (user) => user.auth_encrypted || user.bjt_pwd_encrypted,
  );
  const key = hasEncryptedCredentials ? readOrCreateKey(configDir) : null;
  for (const user of users) {
    if (user.auth_encrypted) {
      user.auth = decrypt(user.auth_encrypted, key);
    }
    if (user.bjt_pwd_encrypted) {
      user.bjt_pwd = decrypt(user.bjt_pwd_encrypted, key);
    }
    delete user.auth_encrypted;
    delete user.bjt_pwd_encrypted;
  }
  return unprotectedConfig;
}

export function needsCredentialMigration(config) {
  const users = Array.isArray(config?.users) ? config.users : [];
  return users.some(
    (user) =>
      (typeof user.auth === 'string' && user.auth.length > 0) ||
      (typeof user.bjt_pwd === 'string' && user.bjt_pwd.length > 0),
  );
}
