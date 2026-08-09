import { createHash, randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { getConfigDir } from './config-manager.js';

const DEFAULT_STALE_MS = 30 * 60 * 1000;

export class AccountLockError extends Error {
  constructor(message = '账号操作正在执行，请稍后重试') {
    super(message);
    this.name = 'AccountLockError';
    this.code = 'ACCOUNT_LOCKED';
  }
}

export class RenewalLockError extends Error {
  constructor(message = '该账号已有续签任务正在执行，请稍后重试') {
    super(message);
    this.name = 'RenewalLockError';
    this.code = 'RENEWAL_LOCKED';
  }
}

function getAccountLockPath(user, purpose) {
  const identity = String(user?.bjt_phone || user?.name || user?.auth || 'unknown');
  const key = createHash('sha256').update(identity).digest('hex').slice(0, 24);
  return join(getConfigDir(), 'locks', `${purpose}-${key}.lock`);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function readOwner(lockPath) {
  try {
    return JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

function removeStaleLock(lockPath, staleMs, now) {
  const owner = readOwner(lockPath);
  const createdAt = Date.parse(owner?.createdAt || '');
  const staleByAge = Number.isFinite(createdAt) && now - createdAt > staleMs;
  const abandoned = owner && !isProcessAlive(Number(owner.pid));
  if (!owner || staleByAge || abandoned) {
    try {
      unlinkSync(lockPath);
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') return true;
      throw error;
    }
  }
  return false;
}

export function acquireAccountLock(
  user,
  purpose,
  {
    lockMessage = '账号操作正在执行，请稍后重试',
    now = Date.now(),
    staleMs = DEFAULT_STALE_MS,
  } = {},
) {
  if (!/^[a-z][a-z0-9-]*$/.test(purpose)) {
    throw new Error('账号锁用途格式无效');
  }
  const lockPath = getAccountLockPath(user, purpose);
  mkdirSync(join(getConfigDir(), 'locks'), { recursive: true, mode: 0o700 });
  const token = randomBytes(24).toString('hex');
  const owner = {
    createdAt: new Date(now).toISOString(),
    pid: process.pid,
    token,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let descriptor;
    try {
      descriptor = openSync(lockPath, 'wx', 0o600);
      writeFileSync(descriptor, JSON.stringify(owner), 'utf8');
      closeSync(descriptor);
      descriptor = undefined;
      break;
    } catch (error) {
      if (descriptor !== undefined) closeSync(descriptor);
      if (error?.code !== 'EEXIST') throw error;
      if (attempt === 0 && removeStaleLock(lockPath, staleMs, now)) continue;
      throw new AccountLockError(lockMessage);
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (!existsSync(lockPath)) return;
    const current = readOwner(lockPath);
    if (current?.token !== token) return;
    try {
      unlinkSync(lockPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  };
}

export function acquireRenewalLock(user, options = {}) {
  try {
    return acquireAccountLock(user, 'renewal', {
      ...options,
      lockMessage: '该账号已有续签任务正在执行，请稍后重试',
    });
  } catch (error) {
    if (error instanceof AccountLockError) {
      throw new RenewalLockError(error.message);
    }
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withAccountLockWait(
  user,
  purpose,
  operation,
  {
    pollMs = 200,
    waitMs = 90_000,
    ...lockOptions
  } = {},
) {
  const deadline = Date.now() + waitMs;
  while (true) {
    let release;
    try {
      release = acquireAccountLock(user, purpose, lockOptions);
    } catch (error) {
      if (!(error instanceof AccountLockError) || Date.now() >= deadline) {
        throw error;
      }
      await delay(pollMs);
      continue;
    }
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

export async function withRenewalLock(user, operation, options) {
  const release = acquireRenewalLock(user, options);
  try {
    return await operation();
  } finally {
    release();
  }
}
