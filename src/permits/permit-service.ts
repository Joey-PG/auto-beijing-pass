import { login } from '../bjt/login.js';
import type { CredentialService } from '../credentials/credential-service.js';
import type { AccountsRepo } from '../database/repositories/accounts.repo.js';
import type { CredentialsRepo } from '../database/repositories/credentials.repo.js';
import type { JobsRepo } from '../database/repositories/jobs.repo.js';
import type { PermitRecordsRepo } from '../database/repositories/permit-records.repo.js';
import type { VehiclesRepo } from '../database/repositories/vehicles.repo.js';
import { API_BASE_URL } from '../jtgl/constants.js';
import { ApiClient } from '../jtgl/api-client.js';
import {
  buildApplyPayload,
  getLatestRecord,
  parseStateData,
  parseUserInfo,
  parseVehicle,
} from '../jtgl/models.js';
import { decidePermitAction } from './renewal-policy.js';
import { selectVehicle } from './vehicle-selector.js';

export type PermitServiceDeps = {
  accountsRepo: AccountsRepo;
  credentialsRepo: CredentialsRepo;
  vehiclesRepo: VehiclesRepo;
  jobsRepo: JobsRepo;
  permitRecordsRepo: PermitRecordsRepo;
  credentialService: CredentialService;
};

export class PermitService {
  constructor(private readonly deps: PermitServiceDeps) {}

  async status(accountName: string) {
    const account = await this.requireAccount(accountName);
    const api = await this.createApi(account.id, account.phone);
    const state = parseStateData(await api.getStateData());
    return { account, state };
  }

  async syncVehicles(accountName: string) {
    const account = await this.requireAccount(accountName);
    const api = await this.createApi(account.id, account.phone);
    const rawVehicles = (await api.listVehicles()) as any[];
    const parsed = rawVehicles.map(parseVehicle);
    for (const vehicle of parsed) {
      await this.deps.vehiclesRepo.upsertForAccount({
        accountId: account.id,
        plateNumber: vehicle.licenseNumber,
        plateType: vehicle.licensePlateType,
        vehicleType: vehicle.vehicleType,
        engineNumberMasked: maskEngine(vehicle.engineNumber),
        brand: vehicle.brand,
        registrationDate: vehicle.registrationDate,
        externalVehicleId: vehicle.vehicleId,
        lastSeenAt: new Date(),
      });
    }
    return parsed;
  }

  async run(accountName: string, options: { plate?: string; triggerType?: 'manual' | 'scheduled' }) {
    const account = await this.requireAccount(accountName);
    const job = await this.deps.jobsRepo.createRunning(account.id, options.triggerType || 'manual');
    try {
      const api = await this.createApi(account.id, account.phone);
      const rawState = await api.getStateData();
      const state = parseStateData(rawState);
      const selected = selectVehicle(
        state.vehicles.map((vehicle) => ({
          ...vehicle,
          plateNumber: vehicle.licenseNumber,
          records: [...vehicle.records, ...vehicle.secondaryRecords],
        })),
        { explicitPlate: options.plate, preferredPlate: account.preferredPlate },
      );

      if (!selected) {
        await this.deps.jobsRepo.finishSuccess(job.id, '未找到绑定车辆');
        return { applied: false, message: '未找到绑定车辆' };
      }

      const latestRecord = getLatestRecord(selected);
      const quotaExhausted =
        String(selected.remainingTimes) === '0' && String(selected.remainingDays) === '0';
      if (quotaExhausted) {
        await this.deps.jobsRepo.finishSuccess(job.id, '剩余次数和天数已用完');
        return { applied: false, message: '剩余次数和天数已用完' };
      }

      const today = new Date().toISOString().slice(0, 10);
      const decision = decidePermitAction(latestRecord, { today });
      await this.savePermitSnapshot(account.id, job.id, selected, latestRecord);

      if (decision.action === 'skip') {
        await this.deps.jobsRepo.finishSuccess(job.id, `无需办理: ${decision.reason}`);
        return { applied: false, message: `无需办理: ${decision.reason}` };
      }

      const fullVehicles = ((await api.listVehicles()) as any[]).map(parseVehicle);
      const fullVehicle = fullVehicles.find((vehicle) => vehicle.licenseNumber === selected.licenseNumber);
      if (!fullVehicle) throw new Error(`未找到车辆详细信息: ${selected.licenseNumber}`);

      const userInfo = parseUserInfo(await api.getUserInfo());
      const payload = buildApplyPayload(
        fullVehicle,
        userInfo,
        decision.applyDate,
        account.defaultEntryType,
      );
      await api.submitApply(payload);
      await this.deps.jobsRepo.finishSuccess(job.id, `已提交申请: ${selected.licenseNumber}`);
      return { applied: true, message: `已提交申请: ${selected.licenseNumber}` };
    } catch (error) {
      await this.deps.jobsRepo.finishFailure(job.id, error as Error);
      throw error;
    }
  }

  private async createApi(accountId: string, phone: string): Promise<ApiClient> {
    const tokenSecret = await this.deps.credentialsRepo.findSecret(accountId, 'token');
    if (tokenSecret) {
      return new ApiClient(API_BASE_URL, this.deps.credentialService.decrypt(tokenSecret));
    }

    const passwordSecret = await this.deps.credentialsRepo.findSecret(accountId, 'password');
    if (!passwordSecret) throw new Error('账号缺少密码凭据');
    const token = await login(phone, this.deps.credentialService.decrypt(passwordSecret));
    await this.deps.credentialsRepo.upsertSecret(
      accountId,
      'token',
      this.deps.credentialService.encrypt(token),
    );
    return new ApiClient(API_BASE_URL, token);
  }

  private async requireAccount(name: string) {
    const account = await this.deps.accountsRepo.findByName(name);
    if (!account) throw new Error(`账号不存在: ${name}`);
    return account;
  }

  private async savePermitSnapshot(
    accountId: string,
    jobRunId: string,
    vehicle: { licenseNumber: string; remainingTimes: string },
    record: ReturnType<typeof getLatestRecord>,
  ) {
    if (!record) return;
    await this.deps.permitRecordsRepo.create({
      accountId,
      jobRunId,
      plateNumber: vehicle.licenseNumber,
      statusName: record.statusName,
      validFrom: record.validFrom,
      validTo: record.validTo,
      remainingDays: Number(record.remainingDays) || null,
      remainingTimes: Number(vehicle.remainingTimes) || null,
      entryType: record.entryTypeName,
      applyTime: record.applyTime,
      rawSnapshotJson: record,
    });
  }
}

function maskEngine(engineNumber: string): string {
  if (!engineNumber) return '';
  if (engineNumber.length <= 2) return '**';
  return `${'*'.repeat(Math.max(0, engineNumber.length - 2))}${engineNumber.slice(-2)}`;
}
