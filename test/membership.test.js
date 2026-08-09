import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addCalendarMonths,
  createMembership,
  extendMembership,
  getMembershipInfo,
  migrateMembershipConfig,
} from '../src/lib/membership.js';

const TODAY = new Date('2026-08-09T04:00:00.000Z');

test('membership expiry is inclusive in Beijing time', () => {
  const user = {
    membership_started_on: '2025-08-09',
    membership_expires_on: '2026-08-09',
  };
  assert.equal(getMembershipInfo(user, TODAY).active, true);
  assert.equal(getMembershipInfo(user, TODAY).status, 'expiring_soon');
  assert.equal(getMembershipInfo(user, TODAY).remainingDays, 0);
  assert.equal(
    getMembershipInfo(user, new Date('2026-08-10T04:00:00.000Z')).status,
    'expired',
  );
});

test('calendar terms clamp month ends and leap days', () => {
  assert.equal(addCalendarMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addCalendarMonths('2024-02-29', 12), '2025-02-28');
});

test('new membership defaults to one year and renewal extends future expiry', () => {
  assert.deepEqual(createMembership({}, TODAY), {
    membership_started_on: '2026-08-09',
    membership_expires_on: '2027-08-09',
    membership_permanent: false,
  });
  assert.equal(
    extendMembership(
      { membership_started_on: '2026-01-01', membership_expires_on: '2027-01-01' },
      { membershipTerm: '1y' },
      TODAY,
    ).membership_expires_on,
    '2028-01-01',
  );
  assert.equal(
    extendMembership(
      { membership_started_on: '2025-01-01', membership_expires_on: '2026-01-01' },
      { membershipTerm: '3m' },
      TODAY,
    ).membership_expires_on,
    '2026-11-09',
  );
});

test('legacy accounts receive the fixed one-time 2026 annual term', () => {
  const original = { users: [{ name: '旧账号' }] };
  const first = migrateMembershipConfig(original);
  const second = migrateMembershipConfig(first.config);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(first.config.users[0].membership_started_on, '2026-08-09');
  assert.equal(first.config.users[0].membership_expires_on, '2027-08-09');
});
