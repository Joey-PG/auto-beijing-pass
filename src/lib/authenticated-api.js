import { API_BASE_URL } from '../constants.js';
import { ApiManager } from './api-manager.js';
import { writeAuditEvent } from './audit-logger.js';
import { login } from './bjt-login.js';
import {
  getAccountLabel,
  getUsers,
  resolveUser,
  updateUser,
} from './config-manager.js';
import { notify } from './notifier.js';
import { withAccountLockWait } from './renewal-lock.js';

const refreshFlights = new Map();

export class AutomaticLoginError extends Error {
  constructor(message, cause = null) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AutomaticLoginError';
    this.code = 'AUTOMATIC_LOGIN_FAILED';
  }
}

function getRefreshKey(user) {
  return String(user?.bjt_phone || user?.name || 'unknown');
}

function getLatestUser(user) {
  const users = getUsers();
  const selector = user?.bjt_phone || user?.name;
  return resolveUser(users, selector);
}

async function reportRefreshFailure(user, error, notifyFn) {
  const message = error instanceof Error ? error.message : String(error);
  writeAuditEvent(
    'account_token_refresh_failed',
    {
      account: getAccountLabel(user),
      error: message,
      result: 'failure',
      reason: 'token_expired',
    },
    { level: 'error' },
  );
  if (user?.notify_urls?.length > 0) {
    try {
      await notifyFn(
        user.notify_urls,
        `[${getAccountLabel(user)}] 北京通登录失效`,
        `${message}\n请在 Web 账号管理或 CLI 中重新登录。`,
      );
    } catch {
      // The original authentication error remains the actionable failure.
    }
  }
}

async function refreshBusinessToken(
  user,
  failedToken,
  { loginFn = login, notifyFn = notify } = {},
) {
  const key = getRefreshKey(user);
  if (refreshFlights.has(key)) return refreshFlights.get(key);

  const refresh = withAccountLockWait(
    user,
    'credential-refresh',
    async () => {
      const latestUser = getLatestUser(user);
      if (latestUser?.auth && latestUser.auth !== failedToken) {
        user.auth = latestUser.auth;
        return latestUser.auth;
      }
      try {
        if (!latestUser?.bjt_pwd) {
          throw new AutomaticLoginError(
            `账号 ${getAccountLabel(latestUser || user)} 未保存加密的北京通密码，请先重新登录一次`,
          );
        }
        const token = await loginFn(latestUser.bjt_phone, latestUser.bjt_pwd);
        updateUser({ auth: token }, latestUser.bjt_phone);
        user.auth = token;
        writeAuditEvent('account_token_refreshed', {
          account: getAccountLabel(latestUser),
          result: 'success',
          reason: 'token_expired',
        });
        return token;
      } catch (error) {
        await reportRefreshFailure(latestUser || user, error, notifyFn);
        if (error instanceof AutomaticLoginError) throw error;
        throw new AutomaticLoginError(
          `账号 ${getAccountLabel(latestUser)} 自动重新登录失败，请检查北京通密码`,
          error,
        );
      }
    },
    {
      lockMessage: '该账号正在刷新登录状态，请稍后重试',
      staleMs: 5 * 60 * 1000,
      waitMs: 90_000,
    },
  );

  refreshFlights.set(key, refresh);
  try {
    return await refresh;
  } finally {
    if (refreshFlights.get(key) === refresh) refreshFlights.delete(key);
  }
}

export function createAuthenticatedApi(
  user,
  {
    baseUrl = API_BASE_URL,
    fetchImpl = globalThis.fetch,
    loginFn = login,
    notifyFn = notify,
    timeoutMs,
  } = {},
) {
  return new ApiManager(baseUrl, user.auth, {
    fetchImpl,
    refreshToken: ({ failedToken }) =>
      refreshBusinessToken(user, failedToken, { loginFn, notifyFn }),
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  });
}
