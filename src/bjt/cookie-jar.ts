export class CookieJar {
  private readonly cookies = new Map<string, string>();

  add(setCookieHeader: string | null | undefined): void {
    if (!setCookieHeader) return;
    const pair = setCookieHeader.split(';')[0]?.trim();
    const index = pair?.indexOf('=') ?? -1;
    if (!pair || index <= 0) return;
    this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }

  addFromResponse(response: Response): void {
    const headers = response.headers as Headers & {
      getSetCookie?: () => string[];
      raw?: () => Record<string, string[]>;
    };
    const setCookies = headers.getSetCookie?.() || headers.raw?.()['set-cookie'] || [];
    for (const header of setCookies) this.add(header);
  }

  toString(): string {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}
