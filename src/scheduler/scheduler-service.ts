import { CronExpressionParser } from 'cron-parser';
import type { LockService } from './lock-service.js';

export type DueSchedule = {
  id: string;
  accountId: string;
  cronExpr: string;
  timezone: string;
};

export type SchedulerRepos = {
  listDue(now: Date): Promise<DueSchedule[]>;
  updateRunTimes(id: string, lastRunAt: Date, nextRunAt: Date): Promise<void>;
};

export type ScheduledRunner = (accountId: string) => Promise<void>;

export function isDue(nextRunAt: Date | null, now: Date): boolean {
  return nextRunAt !== null && nextRunAt.getTime() <= now.getTime();
}

export function computeNextRun(cronExpr: string, timezone: string, from: Date): Date {
  const expression = CronExpressionParser.parse(cronExpr, {
    currentDate: from,
    tz: timezone,
  });
  return expression.next().toDate();
}

export class SchedulerService {
  constructor(
    private readonly schedules: SchedulerRepos,
    private readonly locks: LockService,
    private readonly runner: ScheduledRunner,
  ) {}

  async tick(now = new Date()): Promise<{ due: number; executed: number; skipped: number }> {
    const dueSchedules = await this.schedules.listDue(now);
    let executed = 0;
    let skipped = 0;

    for (const schedule of dueSchedules) {
      if (!this.locks.acquire(schedule.accountId)) {
        skipped++;
        continue;
      }

      try {
        await this.runner(schedule.accountId);
        const nextRunAt = computeNextRun(schedule.cronExpr, schedule.timezone, now);
        await this.schedules.updateRunTimes(schedule.id, now, nextRunAt);
        executed++;
      } finally {
        this.locks.release(schedule.accountId);
      }
    }

    return { due: dueSchedules.length, executed, skipped };
  }
}
