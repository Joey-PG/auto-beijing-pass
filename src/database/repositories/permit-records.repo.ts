import { desc, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { permitRecords } from '../schema.js';

export class PermitRecordsRepo {
  constructor(private readonly db: Database) {}

  async create(input: typeof permitRecords.$inferInsert) {
    const [record] = await this.db.insert(permitRecords).values(input).returning();
    return record;
  }

  async listRecent(accountId: string, limit = 10) {
    return this.db
      .select()
      .from(permitRecords)
      .where(eq(permitRecords.accountId, accountId))
      .orderBy(desc(permitRecords.createdAt))
      .limit(limit);
  }
}
