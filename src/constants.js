export const VEHICLE_TYPE_MAP = {
  '01': '客车',
  '02': '货车',
};

export const LICENSE_PLATE_TYPE_MAP = {
  '02': '小型汽车',
  '01': '大型汽车',
  '52': '小型新能源汽车',
  '51': '大型新能源汽车',
  '06': '外籍汽车',
  '13': '低速车',
};

export const SOURCE = '99c4g1a438jgf412sa3xvckd43256h7g';

export const COMMAND_NAME =
  process.env.AUTO_BJ_PASS_COMMAND_NAME ||
  process.env.CROSS_BJ_COMMAND_NAME ||
  'auto-bj-pass';
export const CONFIG_DIR = '.auto-bj-pass';
export const CONFIG_FILE = 'config.json';

// API base URL (XOR-obfuscated to avoid plaintext in source)
const _k = 'auto-bj-pass';
const _d = '0901001f5e5845021a0b095d0b01130303000f441a081d144f121b190301041741554740';
export const API_BASE_URL = Buffer.from(_d, 'hex').map((b, i) => b ^ _k.charCodeAt(i % _k.length)).toString();
