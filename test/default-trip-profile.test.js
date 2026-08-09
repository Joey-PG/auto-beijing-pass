import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTripProfile,
  isCompleteTripProfile,
  requireTripProfile,
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
