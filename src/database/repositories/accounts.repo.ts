import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { accounts, type NewAccount } from '../schema.js';

export class AccountsRepo {
  constructor(private readonly db: Database) {}

  async create(input: NewAccount) {
    const [account] = await this.db.insert(accounts).values(input).returning();
    return account;
  }

  async findByName(name: string) {
    const [account] = await this.db.select().from(accounts).where(eq(accounts.name, name)).limit(1);
    return account ?? null;
  }

  async list() {
    return this.db.select().from(accounts).orderBy(accounts.name);
  }

  async setEnabled(name: string, enabled: boolean) {
    const [account] = await this.db
      .update(accounts)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(accounts.name, name))
      .returning();
    return account ?? null;
  }

  async markPasswordUpdateRequired(accountId: string, required: boolean) {
    await this.db
      .update(accounts)
      .set({ needsPasswordUpdate: required, updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
  }
}
