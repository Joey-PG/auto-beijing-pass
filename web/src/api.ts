import type { ApiResponse, AuditPageData, AuditQuery, Dashboard } from './types';

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `请求失败（HTTP ${response.status}）`);
  }
  return payload.data;
}

export const dashboardApi = {
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
  getAudit: (query: AuditQuery) => {
    const search = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      since: query.since,
    });
    if (query.account) search.set('account', query.account);
    if (query.event) search.set('event', query.event);
    if (query.status) search.set('status', query.status);
    return request<AuditPageData>(`/api/audit?${search}`);
  },
  getDashboard: () => request<Dashboard>('/api/dashboard'),
  renewVehicle: (accountId: string, licenseNumber: string) =>
    request<{ applied: boolean; message: string }>('/api/renewals', {
      body: JSON.stringify({ accountId, licenseNumber }),
      method: 'POST',
    }),
  updateAccount: (
    accountId: string,
    body: Record<string, boolean | string>,
  ) =>
    request<{ updated: boolean }>(`/api/accounts/${encodeURIComponent(accountId)}`, {
      body: JSON.stringify(body),
      method: 'PATCH',
    }),
};
