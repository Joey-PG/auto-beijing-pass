import { LICENSE_PLATE_TYPE_MAP, VEHICLE_TYPE_MAP } from './constants.js';

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

export function parseVehicle(data: any): ParsedVehicle {
  return {
    licenseNumber: data.hphm || '',
    licensePlateType: data.hpzl || '',
    licensePlateTypeName: LICENSE_PLATE_TYPE_MAP[data.hpzl] || data.hpzl || '',
    vehicleType: data.cllx || '',
    vehicleTypeName: VEHICLE_TYPE_MAP[data.cllx] || data.cllx || '',
    engineNumber: data.fdjh || '',
    brand: data.ppxh || '',
    registrationDate: data.zcsj || '',
    vehicleId: data.vId || '',
  };
}

export function parseUserInfo(data: any): { idNumber: string; name: string } {
  return {
    idNumber: data.jszh || '',
    name: data.jsrxm || '',
  };
}

export function parseRecord(data: any): ParsedRecord {
  return {
    vehicleId: data.vId || '',
    applyId: data.applyId || '',
    statusCode: data.blzt || '',
    statusName: data.blztmc || '',
    validFrom: data.yxqs || '',
    validTo: data.yxqz || '',
    remainingDays: data.sxsyts ?? '',
    entryType: data.jjzzl || '',
    entryTypeName: data.jjzzlmc || '',
    applyTime: data.sqsj || '',
    licenseNumber: data.hphm || '',
  };
}

export function parseStateData(data: any): { idNumber: string; vehicles: ParsedStateVehicle[] } {
  return {
    idNumber: data.sfzmhm || '',
    vehicles: (data.bzclxx || []).map((vehicle: any) => ({
      vId: vehicle.vId || '',
      licensePlateType: vehicle.hpzl || '',
      licenseNumber: vehicle.hphm || '',
      remainingTimes: String(vehicle.sycs ?? ''),
      remainingDays: String(vehicle.syts ?? ''),
      vehicleType: vehicle.cllx || '',
      records: (vehicle.bzxx || []).map(parseRecord),
      secondaryRecords: (vehicle.ecbzxx || []).map(parseRecord),
    })),
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
