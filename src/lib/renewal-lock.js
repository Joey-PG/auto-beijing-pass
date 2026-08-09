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

export class RenewalLockError extends Error {
  constructor(message = '该账号已有续签任务正在执行，请稍后重试') {
    super(message);
    this.name = 'RenewalLockError';
    this.code = 'RENEWAL_LOCKED';
  }
}

function getAccountLockPath(user) {
  const identity = String(user?.bjt_phone || user?.name || user?.auth || 'unknown');
  const key = createHash('sha256').update(identity).digest('hex').slice(0, 24);
  return join(getConfigDir(), 'locks', `renewal-${key}.lock`);
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

export function acquireRenewalLock(
  user,
  { now = Date.now(), staleMs = DEFAULT_STALE_MS } = {},
) {
  const lockPath = getAccountLockPath(user);
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
      throw new RenewalLockError();
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

export async function withRenewalLock(user, operation, options) {
  const release = acquireRenewalLock(user, options);
  try {
    return await operation();
  } finally {
    release();
  }
}
