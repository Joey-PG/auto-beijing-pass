const SECRET_QUERY_KEYS = new Set(['token', 'key', 'secret', 'access_token', 'password']);

export function redactToken(value: string | null | undefined): string {
  if (!value || value.length < 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactNotificationUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    if (url.hostname) url.hostname = '***';
    if (url.pathname && url.pathname !== '/') url.pathname = '/***';

    for (const key of Array.from(url.searchParams.keys())) {
      if (SECRET_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, '***');
      }
    }

    return url.toString();
  } catch {
    return redactToken(value);
  }
}
