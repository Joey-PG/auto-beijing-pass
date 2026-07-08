import { LICENSE_PLATE_TYPE_MAP, VEHICLE_TYPE_MAP } from './constants.js';

type RawRecord = Record<string, unknown>;

function readString(data: RawRecord, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function readUnknownArray(data: RawRecord, key: string): unknown[] {
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

function readStringOrNumber(data: RawRecord, key: string): string | number {
  const value = data[key];
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

export type ParsedVehicle = {
  licenseNumber: string;
  licensePlateType: string;
  licensePlateTypeName: string;
  vehicleType: string;
  vehicleTypeName: string;
  engineNumber: string;
  brand: string;
  registrationDate: string;
  vehicleId: string;
};

export type ParsedRecord = {
  vehicleId: string;
  applyId: string;
  statusCode: string;
  statusName: string;
  validFrom: string;
  validTo: string;
  remainingDays: string | number;
  entryType: string;
  entryTypeName: string;
  applyTime: string;
  licenseNumber: string;
};

export type ParsedStateVehicle = {
  vId: string;
  licensePlateType: string;
  licenseNumber: string;
  remainingTimes: string;
  remainingDays: string;
  vehicleType: string;
  records: ParsedRecord[];
  secondaryRecords: ParsedRecord[];
};

export function parseVehicle(data: RawRecord): ParsedVehicle {
  return {
    licenseNumber: readString(data, 'hphm'),
    licensePlateType: readString(data, 'hpzl'),
    licensePlateTypeName:
      LICENSE_PLATE_TYPE_MAP[readString(data, 'hpzl')] || readString(data, 'hpzl'),
    vehicleType: readString(data, 'cllx'),
    vehicleTypeName: VEHICLE_TYPE_MAP[readString(data, 'cllx')] || readString(data, 'cllx'),
    engineNumber: readString(data, 'fdjh'),
    brand: readString(data, 'ppxh'),
    registrationDate: readString(data, 'zcsj'),
    vehicleId: readString(data, 'vId'),
  };
}

export function parseUserInfo(data: RawRecord): { idNumber: string; name: string } {
  return {
    idNumber: readString(data, 'jszh'),
    name: readString(data, 'jsrxm'),
  };
}

export function parseRecord(data: RawRecord): ParsedRecord {
  return {
    vehicleId: readString(data, 'vId'),
    applyId: readString(data, 'applyId'),
    statusCode: readString(data, 'blzt'),
    statusName: readString(data, 'blztmc'),
    validFrom: readString(data, 'yxqs'),
    validTo: readString(data, 'yxqz'),
    remainingDays: readStringOrNumber(data, 'sxsyts'),
    entryType: readString(data, 'jjzzl'),
    entryTypeName: readString(data, 'jjzzlmc'),
    applyTime: readString(data, 'sqsj'),
    licenseNumber: readString(data, 'hphm'),
  };
}

export function parseStateData(data: RawRecord): { idNumber: string; vehicles: ParsedStateVehicle[] } {
  return {
    idNumber: readString(data, 'sfzmhm'),
    vehicles: readUnknownArray(data, 'bzclxx').map((vehicle) => {
      const item = vehicle as RawRecord;
      return {
        vId: readString(item, 'vId'),
        licensePlateType: readString(item, 'hpzl'),
        licenseNumber: readString(item, 'hphm'),
        remainingTimes: String(item.sycs ?? ''),
        remainingDays: String(item.syts ?? ''),
        vehicleType: readString(item, 'cllx'),
        records: readUnknownArray(item, 'bzxx').map((record) => parseRecord(record as RawRecord)),
        secondaryRecords: readUnknownArray(item, 'ecbzxx').map((record) =>
          parseRecord(record as RawRecord),
        ),
      };
    }),
  };
}

export function getLatestRecord(vehicle: ParsedStateVehicle): ParsedRecord | null {
  if (vehicle.secondaryRecords.length > 0) return vehicle.secondaryRecords[0];
  if (vehicle.records.length > 0) return vehicle.records[0];
  return null;
}

export function buildApplyPayload(
  vehicle: ParsedVehicle,
  userInfo: { name: string; idNumber: string },
  applyDate: string,
  entryType: string,
): Record<string, unknown> {
  return {
    sfzj: 1,
    sqdzgdjd: '116.4',
    sqdzgdwd: '39.9',
    zjxxdzgdjd: '116.4',
    zjxxdzgdwd: '39.9',
    zjxxdz: '北京动物园',
    xxdz: '北京动物园',
    jjmdmc: '其它',
    jjmd: '06',
    area: '海淀区',
    jjdq: '006',
    applyIdOld: '',
    jjrq: applyDate,
    jsrxm: userInfo.name,
    jszh: userInfo.idNumber,
    jjzzl: entryType === '六环内' ? '01' : '02',
    txrxx: [],
    hphm: vehicle.licenseNumber,
    hpzl: vehicle.licensePlateType,
    cllx: vehicle.vehicleType,
    vId: vehicle.vehicleId || '',
  };
}
