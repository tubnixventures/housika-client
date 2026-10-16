import worker from '../index';
import { signJwt } from '../utils/jwt';

export async function runAuthzTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const secret = 'test_secret_12345678901234567890';
  const env: any = { JWT_ACCESS_SECRET: secret };

  try {
    const companyToken = await signJwt(
      { sub: 'acc_comp1', accountType: 'company', role: 'admin', level: 60, companyId: 'comp_1', countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${companyToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'k1' },
        body: JSON.stringify({ unitId: 'unit_123' }),
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 403 && body.error?.code === 'ACCOUNT_TYPE_FORBIDDEN';
    results.push({ name: 'Company token cannot POST /bookings (ACCOUNT_TYPE_FORBIDDEN)', passed });
  } catch (e: any) {
    results.push({ name: 'Company token cannot POST /bookings', passed: false, error: e.message });
  }

  try {
    const individualToken = await signJwt(
      { sub: 'acc_ind1', accountType: 'individual', role: 'tenant', level: 20, countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/company/dashboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${individualToken}` },
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 403 && body.error?.code === 'ACCOUNT_TYPE_FORBIDDEN';
    results.push({ name: 'Individual token blocked from /company/* (ACCOUNT_TYPE_FORBIDDEN)', passed });
  } catch (e: any) {
    results.push({ name: 'Individual token blocked from /company/*', passed: false, error: e.message });
  }

  return results;
}
