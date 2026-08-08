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

export function resolveTripProfile(tripProfile) {
  return tripProfile || DEFAULT_TRIP_PROFILE;
}

