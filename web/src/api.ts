import type {
  AccountCreateInput,
  AccountUpdateInput,
  ApiResponse,
  AuditPageData,
  AuditQuery,
  Dashboard,
  TripProfileInput,
} from './types';

export interface SessionState {
  authenticated: boolean;
  username: string;
}

export class AuthenticationError extends Error {}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (response.status === 401) {
    if (path !== '/api/auth/login') {
      window.dispatchEvent(new CustomEvent('auto-bj-pass:unauthorized'));
    }
    throw new AuthenticationError(payload.message || '请重新登录');
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `请求失败（HTTP ${response.status}）`);
  }
  return payload.data;
}

export const dashboardApi = {
  addAccount: (body: AccountCreateInput) =>
    request<{ id: string; name: string; phone: string }>('/api/accounts', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  getSession: () => request<SessionState>('/api/auth/session'),
  login: (username: string, password: string) =>
    request<SessionState>('/api/auth/login', {
      body: JSON.stringify({ password, username }),
      method: 'POST',
    }),
  logout: () =>
    request<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' }),
  addVehicle: (body: Record<string, string>) =>
    request<{ licenseNumber: string }>('/api/vehicles', {
      body: JSON.stringify(body),
      method: 'POST',
    }),
  deleteVehicle: (accountId: string, vehicleId: string) =>
    request<{ licenseNumber: string }>(
      `/api/vehicles/${encodeURIComponent(accountId)}/${encodeURIComponent(vehicleId)}`,
      { method: 'DELETE' },
    ),
  deleteAccount: (accountId: string) =>
    request<{ removed: boolean }>(`/api/accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    }),
  getAudit: (query: AuditQuery) => {
    const search = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      since: query.since,
    });
    if (query.account) search.set('account', query.account);
    if (query.event) search.set('event', query.event);
    if (query.events?.length) search.set('events', query.events.join(','));
    if (query.status) search.set('status', query.status);
    return request<AuditPageData>(`/api/audit?${search}`);
  },
  getDashboard: () => request<Dashboard>('/api/dashboard'),
  renewVehicle: (
    accountId: string,
    licenseNumber: string,
    tripProfile?: TripProfileInput,
  ) =>
    request<{ applied: boolean; message: string }>('/api/renewals', {
      body: JSON.stringify({ accountId, licenseNumber, tripProfile }),
      method: 'POST',
    }),
  reloginAccount: (accountId: string, password: string) =>
    request<{ updated: boolean }>(
      `/api/accounts/${encodeURIComponent(accountId)}/login`,
      {
        body: JSON.stringify({ password }),
        method: 'POST',
      },
    ),
  updateAccount: (
    accountId: string,
    body: AccountUpdateInput | Record<string, boolean | string>,
  ) =>
    request<{ updated: boolean }>(`/api/accounts/${encodeURIComponent(accountId)}`, {
      body: JSON.stringify(body),
      method: 'PATCH',
    }),
  updateTripProfile: (accountId: string, body: TripProfileInput) =>
    request<{ updated: boolean }>(
      `/api/accounts/${encodeURIComponent(accountId)}/trip-profile`,
      {
        body: JSON.stringify(body),
        method: 'PUT',
      },
    ),
};
