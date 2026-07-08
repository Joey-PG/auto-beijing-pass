import { describe, expect, test } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

describe('loadEnv', () => {
  test('loads required environment values', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/auto_bj_dev',
      APP_SECRET_KEY: Buffer.alloc(32, 1).toString('base64'),
      TZ: 'Asia/Shanghai',
      LOG_LEVEL: 'debug',
    });

    expect(env.databaseUrl).toBe('postgres://user:pass@127.0.0.1:5432/auto_bj_dev');
    expect(env.appSecretKey.byteLength).toBe(32);
    expect(env.timezone).toBe('Asia/Shanghai');
    expect(env.logLevel).toBe('debug');
  });

  test('rejects a missing database url', () => {
    expect(() =>
      loadEnv({
        APP_SECRET_KEY: Buffer.alloc(32, 1).toString('base64'),
      }),
    ).toThrow('DATABASE_URL is required');
  });

  test('rejects an invalid secret key length', () => {
    expect(() =>
      loadEnv({
        DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/auto_bj_dev',
        APP_SECRET_KEY: Buffer.alloc(16, 1).toString('base64'),
      }),
    ).toThrow('APP_SECRET_KEY must decode to 32 bytes');
  });
});
