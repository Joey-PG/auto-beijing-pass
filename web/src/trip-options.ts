export interface TripOption {
  code: string;
  name: string;
}

export const BEIJING_DISTRICTS: TripOption[] = [
  { code: '001', name: '东城区' },
  { code: '002', name: '西城区' },
  { code: '003', name: '朝阳区' },
  { code: '004', name: '丰台区' },
  { code: '005', name: '石景山区' },
  { code: '006', name: '海淀区' },
  { code: '007', name: '门头沟区' },
  { code: '008', name: '房山区' },
  { code: '009', name: '通州区' },
  { code: '010', name: '顺义区' },
  { code: '011', name: '昌平区' },
  { code: '012', name: '大兴区' },
  { code: '013', name: '怀柔区' },
  { code: '014', name: '平谷区' },
  { code: '015', name: '密云区' },
  { code: '016', name: '延庆区' },
];

export const TRIP_PURPOSES: TripOption[] = [
  { code: '01', name: '自驾旅游' },
  { code: '06', name: '其它' },
];

export function getBeijingDistrict(name: string) {
  const normalized = name.trim();
  return BEIJING_DISTRICTS.find(
    (district) =>
      district.name === normalized ||
      district.name.replace(/[区县]$/, '') === normalized.replace(/[区县]$/, ''),
  );
}
