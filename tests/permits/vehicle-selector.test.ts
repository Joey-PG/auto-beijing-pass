import { describe, expect, test } from 'vitest';
import { selectVehicle } from '../../src/permits/vehicle-selector.js';

const vehicles = [
  { plateNumber: '京A11111', records: [] },
  { plateNumber: '京B22222', records: [{ statusName: '审核通过(生效中)' }] },
  { plateNumber: '京C33333', records: [] },
];

describe('selectVehicle', () => {
  test('uses explicit plate first', () => {
    expect(selectVehicle(vehicles, { explicitPlate: '京C33333' })?.plateNumber).toBe('京C33333');
  });

  test('uses active vehicle before preferred plate', () => {
    expect(selectVehicle(vehicles, { preferredPlate: '京C33333' })?.plateNumber).toBe('京B22222');
  });

  test('uses preferred plate when no active vehicle exists', () => {
    expect(
      selectVehicle(
        [
          { plateNumber: '京A11111', records: [] },
          { plateNumber: '京C33333', records: [] },
        ],
        { preferredPlate: '京C33333' },
      )?.plateNumber,
    ).toBe('京C33333');
  });

  test('falls back to first vehicle', () => {
    expect(selectVehicle([{ plateNumber: '京A11111', records: [] }], {})?.plateNumber).toBe(
      '京A11111',
    );
  });
});
