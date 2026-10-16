import { Category } from '../types/categories';
import { validationErr } from './errors';

export type FeeTable = Record<string, number>;

export function parseFeeJson(jsonStr: string): FeeTable {
  try {
    return JSON.parse(jsonStr || '{}');
  } catch {
    validationErr('Corrupted fee table configuration');
  }
}

export function getBookingFeeMinor(feeTable: FeeTable, category: Category): number {
  const fee = feeTable[category] ?? feeTable['default'];
  if (fee === undefined) {
    validationErr(`No booking fee defined for category: ${category}`);
  }
  return Math.round(fee);
}

export function computeTotalListingFeeMinor(
  feeTable: FeeTable,
  unitCategories: Category[]
): number {
  if (unitCategories.length === 0) {
    validationErr('At least one unit required to compute listing fee');
  }
  let sum = 0;
  for (const cat of unitCategories) {
    const fee = feeTable[cat] ?? feeTable['default'];
    if (fee === undefined) {
      validationErr(`No listing fee defined for category: ${cat}`);
    }
    sum += Math.round(fee);
  }
  return sum;
}
