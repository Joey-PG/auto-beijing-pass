function normalizeRequiredText(value, label, maxLength = 200) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label}不能为空`);
  if (text.length > maxLength) {
    throw new Error(`${label}不能超过 ${maxLength} 个字符`);
  }
  return text;
}

function normalizeCoordinate(value, label, min, max) {
  const text = String(value ?? '').trim();
  const numeric = Number(text);
  if (!text || !Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${label}无效`);
  }
  return text;
}

export const DEFAULT_TRIP_PROFILE = Object.freeze({
  is_in_beijing: true,
  current_location: Object.freeze({
    longitude: '117.082463',
    latitude: '40.180804',
  }),
  in_beijing_address: Object.freeze({
    address: '王辛庄镇放光村村委会',
    longitude: '117.082463',
    latitude: '40.180804',
  }),
  destination: Object.freeze({
    address: '王辛庄镇放光村村委会',
    longitude: '117.082463',
    latitude: '40.180804',
    area: '平谷区',
    district_code: '014',
  }),
  purpose: Object.freeze({
    name: '其它',
    code: '06',
  }),
  source: 'default',
});

export function createTripProfile(input) {
  const inBeijingAddress = normalizeRequiredText(
    input?.inBeijingAddress,
    '在京地址',
  );
  const inBeijingLongitude = normalizeCoordinate(
    input?.inBeijingLongitude,
    '在京地址经度',
    -180,
    180,
  );
  const inBeijingLatitude = normalizeCoordinate(
    input?.inBeijingLatitude,
    '在京地址纬度',
    -90,
    90,
  );
  const destinationAddress = normalizeRequiredText(
    input?.destinationAddress,
    '进京目的地',
  );
  const destinationLongitude = normalizeCoordinate(
    input?.destinationLongitude,
    '进京目的地经度',
    -180,
    180,
  );
  const destinationLatitude = normalizeCoordinate(
    input?.destinationLatitude,
    '进京目的地纬度',
    -90,
    90,
  );
  const destinationArea = normalizeRequiredText(
    input?.destinationArea,
    '目的地区县',
    40,
  );
  const districtCode = normalizeRequiredText(
    input?.districtCode,
    '区县代码',
    20,
  );
  const purposeName = normalizeRequiredText(
    input?.purposeName,
    '进京目的',
    40,
  );
  const purposeCode = normalizeRequiredText(
    input?.purposeCode,
    '进京目的代码',
    20,
  );

  if (!/^[A-Za-z0-9_-]+$/.test(districtCode)) {
    throw new Error('区县代码只能包含字母、数字、下划线或连字符');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(purposeCode)) {
    throw new Error('进京目的代码只能包含字母、数字、下划线或连字符');
  }

  return {
    is_in_beijing: true,
    current_location: {
      longitude: inBeijingLongitude,
      latitude: inBeijingLatitude,
    },
    in_beijing_address: {
      address: inBeijingAddress,
      longitude: inBeijingLongitude,
      latitude: inBeijingLatitude,
    },
    destination: {
      address: destinationAddress,
      longitude: destinationLongitude,
      latitude: destinationLatitude,
      area: destinationArea,
      district_code: districtCode,
    },
    purpose: {
      name: purposeName,
      code: purposeCode,
    },
    confirmed_at: new Date().toISOString(),
  };
}

export function isCompleteTripProfile(profile) {
  if (!profile || profile.is_in_beijing !== true) return false;
  try {
    createTripProfile({
      inBeijingAddress: profile.in_beijing_address?.address,
      inBeijingLongitude: profile.in_beijing_address?.longitude,
      inBeijingLatitude: profile.in_beijing_address?.latitude,
      destinationAddress: profile.destination?.address,
      destinationLongitude: profile.destination?.longitude,
      destinationLatitude: profile.destination?.latitude,
      destinationArea: profile.destination?.area,
      districtCode: profile.destination?.district_code,
      purposeName: profile.purpose?.name,
      purposeCode: profile.purpose?.code,
    });
    return true;
  } catch {
    return false;
  }
}

export function getTripProfileMode(user) {
  if (user?.trip_profile_mode === 'default') return 'default';
  if (isCompleteTripProfile(user?.trip_profile)) return 'custom';
  return 'default';
}

export function resolveUserTripProfile(user) {
  const mode = getTripProfileMode(user);
  if (mode === 'default') return DEFAULT_TRIP_PROFILE;
  return user.trip_profile;
}

export function isUserTripProfileConfigured(user) {
  return isCompleteTripProfile(resolveUserTripProfile(user));
}

export function requireTripProfile(profile) {
  if (!isCompleteTripProfile(profile)) {
    throw new Error('未配置完整的出行信息，请先设置在京地址、进京目的地和进京目的');
  }
  return profile;
}
