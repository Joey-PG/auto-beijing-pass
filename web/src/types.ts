export interface RenewalRecord {
  applyId: string;
  applyTime: string;
  entryTypeName: string;
  statusName: string;
  validFrom: string;
  validTo: string;
}

export interface LastExecution {
  event: string;
  result: string;
  timestamp: string;
}

export interface Vehicle {
  accountId: string;
  accountName: string;
  availableDays: number;
  brand: string;
  cannotApplyReason: string;
  engineNumber: string;
  lastExecution: LastExecution | null;
  licenseNumber: string;
  licensePlateType: string;
  licensePlateTypeName: string;
  preferred: boolean;
  records: RenewalRecord[];
  registrationDate: string;
  remainingDays: string;
  remainingTimes: string;
  totalDays: number;
  usedTimes: number;
  vehicleId: string;
  vehicleType: string;
  vehicleTypeName: string;
}

export interface TripProfile {
  destination?: {
    address?: string;
    area?: string;
  };
  in_beijing_address?: {
    address?: string;
  };
  purpose?: {
    name?: string;
  };
}

export interface Account {
  autoRenew: boolean;
  entryType: string;
  error: string | null;
  id: string;
  name: string;
  phone: string;
  preferredVehicle: string;
  tripProfile: TripProfile;
  vehicles: Vehicle[];
}

export interface AccountCreateInput {
  autoRenew: boolean;
  entryType: string;
  name: string;
  password: string;
  phone: string;
}

export interface AccountUpdateInput {
  autoRenew: boolean;
  entryType: string;
  name: string;
}

export interface ScheduleInfo {
  active: boolean;
  catchUpEnabled?: boolean;
  dailyTime?: string | null;
  description: string | null;
  randomWindow: string | null;
  schedule?: string | null;
}

export interface Dashboard {
  accounts: Account[];
  generatedAt: string;
  schedule: ScheduleInfo;
  summary: {
    accountCount: number;
    failedAccountCount: number;
    vehicleCount: number;
  };
}

export interface AuditEvent {
  account?: string;
  actor?: string;
  error?: string;
  event: string;
  level: string;
  plate?: string;
  reason?: string;
  result?: string;
  run_id?: string;
  source?: string;
  timestamp: string;
}

export type AuditOutcome =
  | 'failure'
  | 'in_progress'
  | 'partial_failure'
  | 'skipped'
  | 'success';

export interface AuditPageData {
  items: AuditEvent[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AuditQuery {
  account?: string;
  event?: string;
  page: number;
  pageSize: number;
  since: string;
  status?: AuditOutcome;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type AppView = 'vehicles' | 'audit' | 'accounts' | 'system';
