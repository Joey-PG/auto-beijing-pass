export type PermitRecordLike = {
  statusName: string;
  validTo?: string;
};

export type PermitDecision =
  | { action: 'apply'; applyDate: string; reason: 'no_record' | 'expiring' | 'inactive' }
  | { action: 'skip'; reason: 'still_valid' | 'in_progress' };

const IN_PROGRESS_STATUSES = new Set(['审核中', '审核通过(待生效)']);

export function decidePermitAction(
  record: PermitRecordLike | null,
  options: { today: string },
): PermitDecision {
  if (!record) {
    return { action: 'apply', applyDate: options.today, reason: 'no_record' };
  }

  if (IN_PROGRESS_STATUSES.has(record.statusName)) {
    return { action: 'skip', reason: 'in_progress' };
  }

  if (record.statusName === '审核通过(生效中)') {
    const remaining = countInclusiveDays(options.today, record.validTo || options.today);
    if (remaining <= 1) {
      return { action: 'apply', applyDate: addDays(options.today, 1), reason: 'expiring' };
    }
    return { action: 'skip', reason: 'still_valid' };
  }

  return { action: 'apply', applyDate: options.today, reason: 'inactive' };
}

function countInclusiveDays(from: string, to: string): number {
  const start = parseDate(from);
  const end = parseDate(to);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(diff, 0);
}

function addDays(date: string, days: number): string {
  const parsed = parseDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
