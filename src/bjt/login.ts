import { CookieJar } from './cookie-jar.js';
import { md5, rsaEncrypt } from './crypto-utils.js';
import { recognizeCaptcha } from './ocr.js';

const LOGIN_PAGE_URL =
  'https://bjt.beijing.gov.cn/renzheng/open/m/login/goUserLogin?client_id=100100000343&redirect_uri=https://bjjj.jtgl.beijing.gov.cn/uc/ucfront/userauth&response_type=code&scope=user_info&state=100100004153';
const CAPTCHA_URL = 'https://bjt.beijing.gov.cn/renzheng/common/generateCaptcha';
const LOGIN_URL = 'https://bjt.beijing.gov.cn/renzheng/inner/m/login/doUserLoginByPwd';
const MAX_ATTEMPTS = 3;

type RetryableError = Error & { noRetry?: boolean; retryable?: boolean };

function getUrlParam(url: string | null, key: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    for (const part of parsed.search.slice(1).split('&')) {
      const index = part.indexOf('=');
      if (index > 0 && part.slice(0, index) === key) return part.slice(index + 1);
    }
    for (const part of parsed.hash.slice(1).split('&')) {
      const index = part.indexOf('=');
      if (index > 0 && part.slice(0, index) === key) return part.slice(index + 1);
    }
    return null;
  } catch {
    return null;
  }
}

async function attemptLogin(phone: string, password: string): Promise<string> {
  const jar = new CookieJar();
  const loginPage = await fetch(LOGIN_PAGE_URL, { redirect: 'manual' });
  if (loginPage.status !== 302) {
    throw new Error(`Expected 302 from login page, got ${loginPage.status}`);
  }
  jar.addFromResponse(loginPage);

  const pubKey = getUrlParam(loginPage.headers.get('location'), 'pubKey');
  if (!pubKey) throw new Error('Failed to extract pubKey from login redirect');

  const captchaResponse = await fetch(`${CAPTCHA_URL}?${Date.now()}`, {
    headers: { Cookie: jar.toString() },
  });
  jar.addFromResponse(captchaResponse);
  const captcha = await recognizeCaptcha(Buffer.from(await captchaResponse.arrayBuffer()));

  const encryptData = rsaEncrypt(
    { userIdentity: phone, resetFlag: false, encryptedPwd: md5(password) },
    pubKey,
  );

  const loginResponse = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jar.toString(),
    },
    body: `encryptData=${encodeURIComponent(encryptData)}&captcha=${encodeURIComponent(captcha)}`,
  });
  jar.addFromResponse(loginResponse);
  const loginJson = (await loginResponse.json()) as {
    meta?: { code?: string; message?: string };
    data?: { redirectUrl?: string };
  };

  if (loginJson.meta?.code === '5019') {
    const error = new Error(loginJson.meta.message || '密码错误') as RetryableError;
    error.noRetry = true;
    throw error;
  }

  if (loginJson.meta?.code === '5016') {
    throw new Error(loginJson.meta.message || '验证码错误');
  }

  if (!loginJson.data?.redirectUrl) {
    throw Object.assign(new Error(loginJson.meta?.message || 'No redirectUrl in login response'), {
      retryable: true,
    });
  }

  const redirectResponse = await fetch(loginJson.data.redirectUrl, { redirect: 'manual' });
  if (redirectResponse.status !== 302) {
    throw new Error(`Expected 302 from redirect, got ${redirectResponse.status}`);
  }
  const token = getUrlParam(redirectResponse.headers.get('location'), 'token');
  if (!token) throw new Error('Failed to extract token from final redirect');
  return token;
}

export async function login(phone: string, password: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptLogin(phone, password);
    } catch (error) {
      lastError = error;
      if ((error as RetryableError).noRetry) throw error;
    }
  }
  throw lastError;
}
