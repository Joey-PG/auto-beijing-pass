export const VEHICLE_TYPE_MAP: Record<string, string> = {
  '01': '客车',
  '02': '货车',
};

export const LICENSE_PLATE_TYPE_MAP: Record<string, string> = {
  '02': '小型汽车',
  '01': '大型汽车',
  '52': '小型新能源汽车',
  '51': '大型新能源汽车',
  '06': '外籍汽车',
  '13': '低速车',
};

export const SOURCE = '99c4g1a438jgf412sa3xvckd43256h7g';

const API_KEY = 'cross-bj';
const API_DATA = '0b061b0300174d450918155d195905064d100a1a19440c0d4d1500055d4e0c5051465b40';

export const API_BASE_URL = Buffer.from(API_DATA, 'hex')
  .map((byte, index) => byte ^ API_KEY.charCodeAt(index % API_KEY.length))
  .toString();
