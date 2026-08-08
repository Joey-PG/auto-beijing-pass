import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_TRIP_PROFILE,
  resolveTripProfile,
} from '../src/lib/trip-profile.js';

test('uses Fangguang village committee when no trip profile is configured', () => {
  const profile = resolveTripProfile(null);

  assert.equal(profile, DEFAULT_TRIP_PROFILE);
  assert.deepEqual(profile.current_location, {
    longitude: '117.082463',
    latitude: '40.180804',
  });
  assert.deepEqual(profile.in_beijing_address, {
    address: '王辛庄镇放光村村委会',
    longitude: '117.082463',
    latitude: '40.180804',
  });
  assert.deepEqual(profile.destination, {
    address: '王辛庄镇放光村村委会',
    longitude: '117.082463',
    latitude: '40.180804',
    area: '平谷区',
    district_code: '014',
  });
  assert.deepEqual(profile.purpose, {
    name: '其它',
    code: '06',
  });
});

test('keeps an account-specific trip profile unchanged', () => {
  const custom = {
    destination: {
      address: '自定义地址',
    },
  };

  assert.equal(resolveTripProfile(custom), custom);
});
