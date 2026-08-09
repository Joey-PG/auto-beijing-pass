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
  destination: {
    address: string;
    area: string;
    district_code: string;
    latitude: string;
    longitude: string;
  };
  in_beijing_address: {
    address: string;
    latitude: string;
    longitude: string;
  };
  purpose: {
    code: string;
    name: string;
  };
}

export interface TripProfileInput {
  destinationAddress: string;
  destinationArea: string;
  destinationLatitude: string;
  destinationLongitude: string;
  districtCode: string;
  inBeijingAddress: string;
  inBeijingLatitude: string;
  inBeijingLongitude: string;
  purposeCode: string;
  purposeName: string;
}

export type TripProfileMode = 'default' | 'custom' | 'unconfigured';
export type SelectableTripProfileMode = Exclude<TripProfileMode, 'unconfigured'>;

export interface TripProfileUpdateInput extends Partial<TripProfileInput> {
  tripProfileMode: SelectableTripProfileMode;
}

export interface Account {
  autoRenew: boolean;
  entryType: string;
  error: string | null;
  id: string;
  name: string;
  membershipExpiresOn: string | null;
  membershipPermanent: boolean;
  membershipRemainingDays: number | null;
  membershipStartedOn: string | null;
  membershipStatus: MembershipStatus;
  phone: string;
  preferredVehicle: string;
  tripProfile: TripProfile | null;
  tripProfileConfigured: boolean;
  tripProfileMode: TripProfileMode;
  vehicles: Vehicle[];
}

export type MembershipStatus = 'active' | 'expired' | 'expiring_soon' | 'permanent';
export type MembershipTerm = '1m' | '3m' | '1y' | 'custom' | 'permanent';

export interface AccountCreateInput extends Partial<TripProfileInput> {
  name?: string;
  password: string;
  phone: string;
  membershipExpiresOn?: string;
  membershipTerm: MembershipTerm;
  tripProfileMode: SelectableTripProfileMode;
}

export interface MembershipUpdateInput {
  membershipExpiresOn?: string;
  membershipTerm: MembershipTerm;
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

export interface MapConfig {
  enabled: boolean;
  key: string;
  securityCode: string;
}

export type SchedulerAccountStatus =
  | 'completed'
  | 'disabled'
  | 'expired'
  | 'overdue'
  | 'pending'
  | 'retrying'
  | 'scheduled';

export interface SchedulerAccountInfo {
  completedAt: string | null;
  id: string;
  lastAttemptAt: string | null;
  lastError: string | null;
  name: string;
  nextRetryAt: string | null;
  plannedAt: string | null;
  plannedTime: string | null;
  retryCount: number;
  status: SchedulerAccountStatus;
}

export interface SchedulerRuntimeInfo {
  accounts: SchedulerAccountInfo[];
  counts: Record<SchedulerAccountStatus, number> & {
    eligible: number;
    total: number;
  };
  health: 'healthy' | 'inactive' | 'warning';
  healthMessage: string;
  lastTickAt: string | null;
  lastTickCompletedAt: string | null;
  lastTickResult: string | null;
}

export interface SecurityCheck {
  detail: string;
  id: string;
  label: string;
  status: 'info' | 'pass' | 'warning';
}

export interface SecurityInfo {
  checks: SecurityCheck[];
  connection: 'http' | 'https' | 'local';
}

export interface Dashboard {
  accounts: Account[];
  defaultTripProfile: TripProfile;
  generatedAt: string;
  mapConfig: MapConfig;
  runtime: {
    businessApiLastSuccessAt: string | null;
    timeZone: string;
  };
  schedule: ScheduleInfo;
  scheduler: SchedulerRuntimeInfo;
  security: SecurityInfo;
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
  events?: string[];
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
