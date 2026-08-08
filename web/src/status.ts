import type { Vehicle } from './types';

export interface VehicleStatus {
  color: 'error' | 'success' | 'warning';
  key: 'active' | 'attention' | 'pending';
  label: string;
}

export function getLatestRecord(vehicle: Vehicle) {
  return vehicle.records[0] || null;
}

export function getVehicleStatus(vehicle: Vehicle): VehicleStatus {
  const record = getLatestRecord(vehicle);
  if (!record) return { color: 'error', key: 'attention', label: '暂无证件' };
  if (
    record.statusName.includes('审核中') ||
    record.statusName.includes('待生效')
  ) {
    return { color: 'warning', key: 'pending', label: record.statusName };
  }
  if (record.statusName.includes('生效中')) {
    return { color: 'success', key: 'active', label: '证件有效' };
  }
  return {
    color: 'error',
    key: 'attention',
    label: record.statusName || '需要处理',
  };
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
}
