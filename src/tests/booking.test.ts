import worker from '../index';
import { signJwt } from '../utils/jwt';
import { cosmosCreate } from '../connectors/cosmos';
import { UnitDoc } from '../types/cosmos';

export async function runBookingTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const secret = 'test_secret_12345678901234567890';
  const env: any = { JWT_ACCESS_SECRET: secret };

  const plotUnit: UnitDoc = {
    id: 'unit_plot_test',
    docType: 'unit',
    propertyId: 'prop_1',
    landlordId: 'landlord_other',
    country: 'KE',
    unitNumber: 'P1',
    category: 'plot',
    amount: 5000000,
    period: 'sale',
    currency: 'KES',
    location: 'Nairobi',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await cosmosCreate(env, 'Units', 'KE', plotUnit);

  const bookableUnit: UnitDoc = {
    id: 'unit_bookable_test',
    docType: 'unit',
    propertyId: 'prop_2',
    landlordId: 'landlord_other',
    country: 'KE',
    unitNumber: 'B101',
    category: 'one_bedroom',
    amount: 3000000,
    period: 'month',
    currency: 'KES',
    location: 'Nairobi',
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await cosmosCreate(env, 'Units', 'KE', bookableUnit);

  try {
    const token = await signJwt(
      { sub: 'acc_tenant_1', email: 'tenant@test.com', accountType: 'individual', role: 'tenant', level: 20, countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'key_plot' },
        body: JSON.stringify({ unitId: 'unit_plot_test' }),
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 422 && body.error?.code === 'CATEGORY_NOT_BOOKABLE';
    results.push({ name: 'Plot unit booking fails with CATEGORY_NOT_BOOKABLE', passed });
  } catch (e: any) {
    results.push({ name: 'Plot unit booking fails with CATEGORY_NOT_BOOKABLE', passed: false, error: e.message });
  }

  try {
    const selfLandlordToken = await signJwt(
      { sub: 'landlord_other', email: 'landlord@test.com', accountType: 'individual', role: 'dual', level: 25, countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${selfLandlordToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'key_self' },
        body: JSON.stringify({ unitId: 'unit_bookable_test' }),
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 409 && body.message?.includes('Cannot book your own unit');
    results.push({ name: 'Self-booking own unit rejected with CONFLICT', passed });
  } catch (e: any) {
    results.push({ name: 'Self-booking own unit rejected with CONFLICT', passed: false, error: e.message });
  }

  return results;
}
