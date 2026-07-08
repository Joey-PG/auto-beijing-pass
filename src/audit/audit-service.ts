import type { AuditRepo } from '../database/repositories/audit.repo.js';

export class AuditService {
  constructor(private readonly auditRepo: AuditRepo) {}

  async record(action: string, accountId?: string | null, metadata?: Record<string, unknown>) {
    return this.auditRepo.write({
      actor: 'local_cli',
      action,
      accountId: accountId ?? null,
      metadataJson: metadata ?? null,
    });
  }
}
