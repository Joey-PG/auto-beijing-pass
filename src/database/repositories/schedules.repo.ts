import { and, eq, lte } from 'drizzle-orm';
import type { Database } from '../client.js';
import { schedules, type NewSchedule } from '../schema.js';

export class SchedulesRepo {
  constructor(private readonly db: Database) {}

  async upsert(input: NewSchedule) {
    const existing = await this.findByAccount(input.accountId);
    if (existing) {
      const [updated] = await this.db
        .update(schedules)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(schedules.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(schedules).values(input).returning();
    return created;
  }

  async findByAccount(accountId: string) {
    const [schedule] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.accountId, accountId))
      .limit(1);
    return schedule ?? null;
  }

  async listDue(now: Date) {
    return this.db
      .select()
      .from(schedules)
      .where(and(eq(schedules.enabled, true), lte(schedules.nextRunAt, now)));
  }

  async updateRunTimes(id: string, lastRunAt: Date, nextRunAt: Date) {
    await this.db
      .update(schedules)
      .set({ lastRunAt, nextRunAt, updatedAt: new Date() })
      .where(eq(schedules.id, id));
  }

  async setEnabled(accountId: string, enabled: boolean) {
    await this.db
      .update(schedules)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(schedules.accountId, accountId));
  }
}
