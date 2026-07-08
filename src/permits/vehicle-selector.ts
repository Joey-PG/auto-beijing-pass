export type VehicleLike = {
  plateNumber: string;
  records?: Array<{ statusName: string }>;
};

export type VehicleSelectionOptions = {
  explicitPlate?: string;
  preferredPlate?: string | null;
};

const ACTIVE_STATUSES = new Set(['审核通过(生效中)', '审核中', '审核通过(待生效)']);

export function selectVehicle<T extends VehicleLike>(
  vehicles: T[],
  options: VehicleSelectionOptions,
): T | null {
  if (vehicles.length === 0) return null;

  if (options.explicitPlate) {
    return vehicles.find((vehicle) => vehicle.plateNumber === options.explicitPlate) || null;
  }

  const active = vehicles.find((vehicle) =>
    (vehicle.records || []).some((record) => ACTIVE_STATUSES.has(record.statusName)),
  );
  if (active) return active;

  if (options.preferredPlate) {
    const preferred = vehicles.find((vehicle) => vehicle.plateNumber === options.preferredPlate);
    if (preferred) return preferred;
  }

  return vehicles[0];
}
