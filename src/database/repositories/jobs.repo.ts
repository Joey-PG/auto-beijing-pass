import { desc, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { jobRuns } from '../schema.js';

export class JobsRepo {
  constructor(private readonly db: Database) {}

  async createRunning(accountId: string, triggerType: 'manual' | 'scheduled') {
    const [job] = await this.db
      .insert(jobRuns)
      .values({ accountId, triggerType, status: 'running' })
      .returning();
    return job;
  }

  async finishSuccess(id: string, summary: string) {
    await this.db
      .update(jobRuns)
      .set({ status: 'success', summary, finishedAt: new Date() })
      .where(eq(jobRuns.id, id));
  }

  async finishFailure(id: string, error: Error) {
    await this.db
      .update(jobRuns)
      .set({
        status: 'failed',
        errorCode: error.name,
        errorMessage: error.message,
        finishedAt: new Date(),
      })
      .where(eq(jobRuns.id, id));
  }

  async listRecent(limit = 20) {
    return this.db.select().from(jobRuns).orderBy(desc(jobRuns.startedAt)).limit(limit);
  }
}
