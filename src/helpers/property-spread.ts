import { UnitDoc, PropertyDoc } from '../types/cosmos';
import { Category } from '../types/categories';
import { generateId } from './ids';

export interface UnitInput {
  unitNumber: string;
  category: Category;
  amount: number;
  period: string;
  imageKeys?: string[];
}

export function spreadPropertyToUnit(
  prop: Pick<PropertyDoc, 'id' | 'landlordId' | 'country' | 'location' | 'exactLocation' | 'lat' | 'long'>,
  currency: string,
  input: UnitInput,
  nowIso: string
): UnitDoc {
  return {
    id: generateId('unit'),
    docType: 'unit',
    propertyId: prop.id,
    landlordId: prop.landlordId,
    country: prop.country,
    unitNumber: input.unitNumber,
    category: input.category,
    amount: input.amount,
    period: input.period,
    currency,
    location: prop.location,
    exactLocation: prop.exactLocation ?? null,
    lat: prop.lat ?? null,
    long: prop.long ?? null,
    imageKeys: input.imageKeys ?? [],
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
