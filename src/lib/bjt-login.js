/**
 * Beijing Tong (北京通) login module.
 *
 * Handles the full OAuth login flow:
 * 1. Fetch login page to get RSA public key + cookies
 * 2. Fetch and OCR captcha image
 * 3. Encrypt credentials and submit login
 * 4. Follow the SSO callback to obtain an intermediate token
 * 5. Exchange it for the JTGL business accessToken
 */

import { md5, rsaEncrypt } from './crypto-utils.js';
import { recognizeCaptcha } from './ocr.js';

const LOGIN_PAGE_URL =
  'https://bjt.beijing.gov.cn/renzheng/open/m/login/goUserLogin?client_id=100100001423&redirect_uri=https://ssp.jtgl.beijing.gov.cn/sso/callback/userauth&response_type=code&scope=user_info&state=300002';
const CAPTCHA_URL = 'https://bjt.beijing.gov.cn/renzheng/common/generateCaptcha';
const LOGIN_URL = 'https://bjt.beijing.gov.cn/renzheng/inner/m/login/doUserLoginByPwd';
const BUSINESS_TOKEN_EXCHANGE_URL =
  'https://jjz.jtgl.beijing.gov.cn:1443/auth/userController/loginUserByUserCenter';
const BUSINESS_LOGIN_STATE = '101000004072';
const WECHAT_MINI_PROGRAM_SOURCE = '6ff67657da8346ddab418205e0442a64';
const PORTAL_ORIGIN = 'https://portal.bjt.beijing.gov.cn';
const PORTAL_REFERER = `${PORTAL_ORIGIN}/m/index.html`;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(fetchImpl, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract a query/hash parameter from a URL string.
 */
export function getUrlParam(url, key) {
  // Must NOT url-decode values — Python version returns raw params.
  // URLSearchParams.get() decodes, which corrupts base64 (+ → space).
  try {
    const parsed = new URL(url);
    for (const param of parsed.search.slice(1).split('&')) {
      const eqIdx = param.indexOf('=');
      if (eqIdx > 0 && param.substring(0, eqIdx) === key) {
        return param.substring(eqIdx + 1);
      }
    }
    if (parsed.hash) {
      for (const param of parsed.hash.slice(1).split('&')) {
        const eqIdx = param.indexOf('=');
        if (eqIdx > 0 && param.substring(0, eqIdx) === key) {
          return param.substring(eqIdx + 1);
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Minimal cookie jar that accumulates Set-Cookie headers.
 */
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  /**
   * Parse a single Set-Cookie header value and store name=value.
   */
  add(setCookieHeader) {
    if (!setCookieHeader) return;
    // First segment before ';' is name=value
    const pair = setCookieHeader.split(';')[0].trim();
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const name = pair.substring(0, eqIdx).trim();
      const value = pair.substring(eqIdx + 1).trim();
      this.cookies.set(name, value);
    }
  }

  /**
   * Add all Set-Cookie headers from a fetch Response.
   */
  addFromResponse(resp) {
    let setCookies =
      resp.headers.getSetCookie?.() ||
      resp.headers.raw?.()?.['set-cookie'] ||
      [];
    if (setCookies.length === 0) {
      const combined = resp.headers.get?.('set-cookie');
      if (combined) setCookies = [combined];
    }
    for (const header of setCookies) {
      this.add(header);
    }
  }

  toString() {
    return [...this.cookies.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

/**
 * Exchange the current SSO callback token for the accessToken accepted by
 * the JTGL business APIs.
 */
export async function exchangeBusinessToken(
  intermediateToken,
  fetchImpl = fetch,
) {
  const resp = await fetchWithTimeout(
    fetchImpl,
    `${BUSINESS_TOKEN_EXCHANGE_URL}?state=${BUSINESS_LOGIN_STATE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        source: WECHAT_MINI_PROGRAM_SOURCE,
      },
      body: JSON.stringify({
        token: intermediateToken,
        state: BUSINESS_LOGIN_STATE,
      }),
    },
  );
  if (!resp.ok) {
    throw new Error(`Business token exchange HTTP ${resp.status}`);
  }

  const result = await resp.json();
  if (result?.code !== 200) {
    throw new Error(
      `Business token exchange failed: ${result?.msg || result?.message || result?.code || 'unknown error'}`,
    );
  }

  const token =
    (typeof result.data === 'string' ? result.data : null) ||
    result?.data?.accessToken ||
    result?.accessToken;
  if (!token) {
    throw new Error('Business token exchange did not return accessToken');
  }
  return token;
}

/**
 * Perform a single login attempt.
 *
 * @returns {string} Authorization token
 * @throws on non-retryable errors (bad credentials, etc.)
 */
async function attemptLogin(phone, password) {
  const jar = new CookieJar();

  // Step 1: GET login page (expect 302)
  const resp1 = await fetchWithTimeout(fetch, LOGIN_PAGE_URL, {
    redirect: 'manual',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': USER_AGENT,
    },
  });
  if (resp1.status !== 302) {
    throw new Error(`Expected 302 from login page, got ${resp1.status}`);
  }
  jar.addFromResponse(resp1);
  const location1 = resp1.headers.get('location');
  const pubKey = getUrlParam(location1, 'pubKey');
  if (!pubKey) {
    throw new Error('Failed to extract pubKey from login redirect');
  }

  // Step 2: GET captcha image
  const captchaResp = await fetchWithTimeout(
    fetch,
    `${CAPTCHA_URL}?${Date.now()}`,
    {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Cookie: jar.toString(),
        Referer: location1 || PORTAL_REFERER,
        'User-Agent': USER_AGENT,
      },
    },
  );
  if (!captchaResp.ok) {
    throw new Error(`Captcha request failed: HTTP ${captchaResp.status}`);
  }
  jar.addFromResponse(captchaResp);
  const imageBuffer = Buffer.from(await captchaResp.arrayBuffer());
  const captcha = await recognizeCaptcha(imageBuffer);

  // Step 3: Encrypt credentials
  const encryptData = rsaEncrypt(
    { userIdentity: phone, resetFlag: false, encryptedPwd: md5(password) },
    pubKey,
  );

  // Step 4: POST login
  const loginResp = await fetchWithTimeout(
    fetch,
    LOGIN_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: jar.toString(),
        Origin: PORTAL_ORIGIN,
        Referer: location1 || PORTAL_REFERER,
        'User-Agent': USER_AGENT,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: `encryptData=${encodeURIComponent(encryptData)}&captcha=${encodeURIComponent(captcha)}`,
    },
  );
  if (!loginResp.ok) {
    throw new Error(`Login request failed: HTTP ${loginResp.status}`);
  }
  jar.addFromResponse(loginResp);
  const loginJson = await loginResp.json();

  const code = String(loginJson?.meta?.code ?? '');
  if (code === '5019') {
    // 密码错误，不重试
    const err = new Error(loginJson.meta.message || '密码错误');
    err.noRetry = true;
    throw err;
  }
  if (['5016', '5017', '5021'].includes(code)) {
    // 验证码错误，可重试
    throw new Error(loginJson.meta.message || '验证码错误');
  }

  const redirectUrl = loginJson?.data?.redirectUrl;
  if (!redirectUrl) {
    // Retryable — likely captcha OCR failure
    throw Object.assign(
      new Error(loginJson?.meta?.message || 'No redirectUrl in login response'),
      { retryable: true },
    );
  }

  // Step 5: Follow the SSO callback (expect an intermediate token in 302).
  const resp5 = await fetchWithTimeout(fetch, redirectUrl, {
    redirect: 'manual',
    headers: {
      Cookie: jar.toString(),
      'User-Agent': USER_AGENT,
    },
  });
  jar.addFromResponse(resp5);
  if (resp5.status !== 302) {
    throw new Error(`Expected 302 from redirect, got ${resp5.status}`);
  }
  const location5 = resp5.headers.get('location');
  const intermediateToken = getUrlParam(location5, 'token');
  if (!intermediateToken) {
    throw new Error('Failed to extract intermediate token from SSO callback');
  }

  // Step 6: Reproduce login_wx_byUserCenter.html's AJAX exchange.
  return exchangeBusinessToken(intermediateToken);
}

/**
 * Login to Beijing Tong and obtain an authorization token.
 *
 * Retries up to 3 times (captcha OCR may fail).
 *
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 * @returns {Promise<string>} Authorization token
 */
export async function login(phone, password) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptLogin(phone, password);
    } catch (err) {
      lastError = err;
      if (err.noRetry) throw err;
      if (attempt < MAX_ATTEMPTS) {
        continue;
      }
    }
  }
  throw lastError;
}
