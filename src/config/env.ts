export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AppEnv = {
  databaseUrl: string;
  appSecretKey: Buffer;
  timezone: string;
  logLevel: LogLevel;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const rawSecret = source.APP_SECRET_KEY;
  if (!rawSecret) {
    throw new Error('APP_SECRET_KEY is required');
  }

  const appSecretKey = Buffer.from(rawSecret, 'base64');
  if (appSecretKey.byteLength !== 32) {
    throw new Error('APP_SECRET_KEY must decode to 32 bytes');
  }

  return {
    databaseUrl,
    appSecretKey,
    timezone: source.TZ || 'Asia/Shanghai',
    logLevel: parseLogLevel(source.LOG_LEVEL || 'info'),
  };
}

function parseLogLevel(value: string): LogLevel {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }
  throw new Error('LOG_LEVEL must be one of debug, info, warn, error');
}
