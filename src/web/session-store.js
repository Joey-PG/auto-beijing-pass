import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

const FILE_VERSION = 1;
const MAX_FILE_BYTES = 1024 * 1024;
const TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function validateSessionEntry(entry) {
  return (
    entry &&
    TOKEN_HASH_PATTERN.test(String(entry.tokenHash || '')) &&
    Number.isSafeInteger(entry.expiresAt) &&
    typeof entry.username === 'string' &&
    entry.username.length > 0 &&
    entry.username.length <= 256
  );
}

export class SessionStore {
  constructor({ filePath = '', now = () => Date.now() } = {}) {
    this.filePath = filePath;
    this.now = now;
    this.sessions = this.load();
  }

  load() {
    if (!this.filePath || !existsSync(this.filePath)) return new Map();
    if (statSync(this.filePath).size > MAX_FILE_BYTES) {
      throw new Error(`Web 会话文件过大: ${this.filePath}`);
    }
    let payload;
    try {
      payload = JSON.parse(readFileSync(this.filePath, 'utf8'));
    } catch (error) {
      throw new Error(
        `无法读取 Web 会话文件 ${this.filePath}: ${error instanceof Error ? error.message : error}`,
      );
    }
    if (payload?.version !== FILE_VERSION || !Array.isArray(payload.sessions)) {
      throw new Error(`Web 会话文件格式无效: ${this.filePath}`);
    }
    const sessions = new Map();
    for (const entry of payload.sessions) {
      if (!validateSessionEntry(entry)) {
        throw new Error(`Web 会话文件包含无效记录: ${this.filePath}`);
      }
      if (entry.expiresAt > this.now()) {
        sessions.set(entry.tokenHash, {
          expiresAt: entry.expiresAt,
          username: entry.username,
        });
      }
    }
    chmodSync(this.filePath, 0o600);
    return sessions;
  }

  get(token) {
    if (typeof token !== 'string' || token.length < 32 || token.length > 256) {
      return null;
    }
    const tokenHash = hashToken(token);
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt <= this.now()) {
      this.sessions.delete(tokenHash);
      try {
        this.persist(this.sessions);
      } catch {
        // Expired sessions remain invalid even if cleanup cannot be persisted.
      }
      return null;
    }
    return { ...session };
  }

  create(token, session) {
    const nextSessions = new Map(
      [...this.sessions].filter(([, value]) => value.expiresAt > this.now()),
    );
    nextSessions.set(hashToken(token), { ...session });
    this.persist(nextSessions);
    this.sessions = nextSessions;
  }

  delete(token) {
    if (typeof token !== 'string' || token.length > 256) return false;
    const tokenHash = hashToken(token);
    if (!this.sessions.has(tokenHash)) return false;
    const nextSessions = new Map(this.sessions);
    nextSessions.delete(tokenHash);
    this.persist(nextSessions);
    this.sessions = nextSessions;
    return true;
  }

  persist(sessions) {
    if (!this.filePath) return;
    const parentDir = dirname(this.filePath);
    mkdirSync(parentDir, { mode: 0o700, recursive: true });
    chmodSync(parentDir, 0o700);
    const temporaryPath =
      `${this.filePath}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    const payload = {
      sessions: [...sessions]
        .map(([tokenHash, session]) => ({ tokenHash, ...session }))
        .sort((left, right) => left.tokenHash.localeCompare(right.tokenHash)),
      version: FILE_VERSION,
    };
    try {
      writeFileSync(temporaryPath, JSON.stringify(payload), {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      chmodSync(temporaryPath, 0o600);
      renameSync(temporaryPath, this.filePath);
      chmodSync(this.filePath, 0o600);
    } catch (error) {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
      throw error;
    }
  }
}
