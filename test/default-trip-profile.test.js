import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTripProfile,
  DEFAULT_TRIP_PROFILE,
  getTripProfileMode,
  isCompleteTripProfile,
  isUserTripProfileConfigured,
  requireTripProfile,
  resolveUserTripProfile,
} from '../src/lib/trip-profile.js';

test('creates and requires a complete account trip profile', () => {
  const profile = createTripProfile({
    inBeijingAddress: '在京地址',
    inBeijingLongitude: '116.40',
    inBeijingLatitude: '39.90',
    destinationAddress: '进京目的地',
    destinationLongitude: '116.41',
    destinationLatitude: '39.91',
    destinationArea: '朝阳区',
    districtCode: '001',
    purposeName: '其它',
    purposeCode: '06',
  });

  assert.equal(isCompleteTripProfile(profile), true);
  assert.equal(requireTripProfile(profile), profile);
  assert.equal(isCompleteTripProfile({ destination: {} }), false);
  assert.throws(() => requireTripProfile(null), /未配置完整的出行信息/);
});

test('uses the system default for explicit and legacy accounts', () => {
  const defaultUser = { trip_profile_mode: 'default' };
  const legacyUser = {};
  const incompleteCustomUser = {
    trip_profile_mode: 'custom',
    trip_profile: { destination: {} },
  };

  assert.equal(getTripProfileMode(defaultUser), 'default');
  assert.equal(resolveUserTripProfile(defaultUser), DEFAULT_TRIP_PROFILE);
  assert.equal(isUserTripProfileConfigured(defaultUser), true);
  assert.equal(getTripProfileMode(legacyUser), 'default');
  assert.equal(resolveUserTripProfile(legacyUser), DEFAULT_TRIP_PROFILE);
  assert.equal(isUserTripProfileConfigured(legacyUser), true);
  assert.equal(getTripProfileMode(incompleteCustomUser), 'default');
  assert.equal(
    resolveUserTripProfile(incompleteCustomUser),
    DEFAULT_TRIP_PROFILE,
  );
  assert.equal(DEFAULT_TRIP_PROFILE.destination.area, '平谷区');
});

test('keeps complete account-specific trip profiles as custom configuration', () => {
  const profile = createTripProfile({
    inBeijingAddress: '自定义在京地址',
    inBeijingLongitude: '116.40',
    inBeijingLatitude: '39.90',
    destinationAddress: '自定义目的地',
    destinationLongitude: '116.41',
    destinationLatitude: '39.91',
    destinationArea: '朝阳区',
    districtCode: '003',
    purposeName: '其它',
    purposeCode: '06',
  });
  const user = { trip_profile: profile };

  assert.equal(getTripProfileMode(user), 'custom');
  assert.equal(resolveUserTripProfile(user), profile);
  assert.equal(isUserTripProfileConfigured(user), true);
});
