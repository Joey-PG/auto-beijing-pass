import { AuditService } from '../audit/audit-service.js';
import { AccountService } from '../accounts/account-service.js';
import { CredentialService } from '../credentials/credential-service.js';
import { loadEnv } from '../config/env.js';
import { createDatabase } from '../database/client.js';
import { AccountsRepo } from '../database/repositories/accounts.repo.js';
import { AuditRepo } from '../database/repositories/audit.repo.js';
import { CredentialsRepo } from '../database/repositories/credentials.repo.js';
import { JobsRepo } from '../database/repositories/jobs.repo.js';
import { NotificationsRepo } from '../database/repositories/notifications.repo.js';
import { PermitRecordsRepo } from '../database/repositories/permit-records.repo.js';
import { SchedulesRepo } from '../database/repositories/schedules.repo.js';
import { VehiclesRepo } from '../database/repositories/vehicles.repo.js';
import { NotificationService } from '../notifications/notification-service.js';
import { PermitService } from '../permits/permit-service.js';

export function createCliContext() {
  const env = loadEnv();
  const db = createDatabase(env.databaseUrl);
  const accountsRepo = new AccountsRepo(db);
  const auditRepo = new AuditRepo(db);
  const credentialsRepo = new CredentialsRepo(db);
  const schedulesRepo = new SchedulesRepo(db);
  const jobsRepo = new JobsRepo(db);
  const vehiclesRepo = new VehiclesRepo(db);
  const notificationsRepo = new NotificationsRepo(db);
  const permitRecordsRepo = new PermitRecordsRepo(db);
  const credentialService = new CredentialService(env.appSecretKey);
  const auditService = new AuditService(auditRepo);
  const notificationService = new NotificationService(notificationsRepo, credentialService);
  const permitService = new PermitService({
    accountsRepo,
    credentialsRepo,
    vehiclesRepo,
    jobsRepo,
    permitRecordsRepo,
    credentialService,
  });
  const accountService = new AccountService(
    accountsRepo,
    credentialsRepo,
    credentialService,
    auditService,
  );

  return {
    env,
    db,
    repos: {
      accountsRepo,
      auditRepo,
      credentialsRepo,
      schedulesRepo,
      jobsRepo,
      vehiclesRepo,
      notificationsRepo,
      permitRecordsRepo,
    },
    services: {
      accountService,
      auditService,
      credentialService,
      notificationService,
      permitService,
    },
  };
}
