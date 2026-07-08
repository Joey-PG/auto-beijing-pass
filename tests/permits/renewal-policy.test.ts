import { describe, expect, test } from 'vitest';
import { decidePermitAction } from '../../src/permits/renewal-policy.js';

describe('decidePermitAction', () => {
  test('applies today when no record exists', () => {
    expect(decidePermitAction(null, { today: '2026-07-08' })).toEqual({
      action: 'apply',
      applyDate: '2026-07-08',
      reason: 'no_record',
    });
  });

  test('applies tomorrow when active record has one day remaining', () => {
    expect(
      decidePermitAction(
        { statusName: '审核通过(生效中)', validTo: '2026-07-08' },
        { today: '2026-07-08' },
      ),
    ).toEqual({ action: 'apply', applyDate: '2026-07-09', reason: 'expiring' });
  });

  test('skips when active record has more than one day remaining', () => {
    expect(
      decidePermitAction(
        { statusName: '审核通过(生效中)', validTo: '2026-07-12' },
        { today: '2026-07-08' },
      ),
    ).toEqual({ action: 'skip', reason: 'still_valid' });
  });

  test('skips reviewing records', () => {
    expect(
      decidePermitAction({ statusName: '审核中', validTo: '' }, { today: '2026-07-08' }),
    ).toEqual({ action: 'skip', reason: 'in_progress' });
  });

  test('applies today for expired or rejected records', () => {
    expect(
      decidePermitAction(
        { statusName: '审核失败', validTo: '2026-07-01' },
        { today: '2026-07-08' },
      ),
    ).toEqual({ action: 'apply', applyDate: '2026-07-08', reason: 'inactive' });
  });
});
