import { desc } from 'drizzle-orm';
import type { Database } from '../client.js';
import { auditLogs, type NewAuditLog } from '../schema.js';

export class AuditRepo {
  constructor(private readonly db: Database) {}

  async write(input: NewAuditLog) {
    const [log] = await this.db.insert(auditLogs).values(input).returning();
    return log;
  }

  async listRecent(limit = 50) {
    return this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
}
