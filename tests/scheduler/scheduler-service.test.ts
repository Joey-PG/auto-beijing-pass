import { describe, expect, test } from 'vitest';
import { computeNextRun, isDue } from '../../src/scheduler/scheduler-service.js';

describe('scheduler helpers', () => {
  test('detects due schedule', () => {
    expect(isDue(new Date('2026-07-08T00:00:00Z'), new Date('2026-07-08T00:00:01Z'))).toBe(
      true,
    );
  });

  test('detects future schedule as not due', () => {
    expect(isDue(new Date('2026-07-08T00:01:00Z'), new Date('2026-07-08T00:00:01Z'))).toBe(
      false,
    );
  });

  test('computes next run from cron expression', () => {
    expect(
      computeNextRun('0 8 * * *', 'Asia/Shanghai', new Date('2026-07-08T00:00:00Z')).toISOString(),
    ).toBe('2026-07-09T00:00:00.000Z');
  });
});
