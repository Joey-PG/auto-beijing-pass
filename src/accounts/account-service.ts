import type { CredentialService } from '../credentials/credential-service.js';
import type { AccountsRepo } from '../database/repositories/accounts.repo.js';
import type { CredentialsRepo } from '../database/repositories/credentials.repo.js';
import type { Account } from '../database/schema.js';
import type { AuditService } from '../audit/audit-service.js';

export type AddAccountInput = {
  name: string;
  phone: string;
  password: string;
  defaultEntryType: string;
};

export class AccountService {
  constructor(
    private readonly accountsRepo: AccountsRepo,
    private readonly credentialsRepo: CredentialsRepo,
    private readonly credentialService: CredentialService,
    private readonly audit: AuditService,
  ) {}

  async add(input: AddAccountInput): Promise<Account> {
    const account = await this.accountsRepo.create({
      name: input.name,
      phone: input.phone,
      defaultEntryType: input.defaultEntryType,
    });
    await this.credentialsRepo.upsertSecret(
      account.id,
      'password',
      this.credentialService.encrypt(input.password),
    );
    await this.audit.record('account.created', account.id, {
      name: account.name,
      phone: account.phone,
    });
    return account;
  }

  async list(): Promise<Account[]> {
    return this.accountsRepo.list();
  }

  async show(name: string): Promise<Account | null> {
    return this.accountsRepo.findByName(name);
  }

  async setEnabled(name: string, enabled: boolean): Promise<Account | null> {
    const account = await this.accountsRepo.setEnabled(name, enabled);
    if (account) {
      await this.audit.record(enabled ? 'account.enabled' : 'account.disabled', account.id, {
        name: account.name,
      });
    }
    return account;
  }

  async updatePassword(name: string, password: string): Promise<Account | null> {
    const account = await this.accountsRepo.findByName(name);
    if (!account) return null;
    await this.credentialsRepo.upsertSecret(
      account.id,
      'password',
      this.credentialService.encrypt(password),
    );
    await this.accountsRepo.markPasswordUpdateRequired(account.id, false);
    await this.audit.record('account.password_updated', account.id, { name: account.name });
    return account;
  }
}
