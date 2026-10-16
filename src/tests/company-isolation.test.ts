import worker from '../index';
import { signJwt } from '../utils/jwt';

export async function runCompanyIsolationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const secret = 'test_secret_12345678901234567890';
  const env: any = { JWT_ACCESS_SECRET: secret };

  try {
    const adminToken = await signJwt(
      { sub: 'acc_adm', accountType: 'company', role: 'admin', level: 60, companyId: 'comp_acme', countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/company/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ceo@acme.com', name: 'New CEO', role: 'ceo', password: 'password123' }),
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 403 && body.error?.code === 'HIERARCHY_RESTRICTED';
    results.push({ name: 'Admin (level 60) cannot create CEO (level 65) (HIERARCHY_RESTRICTED)', passed });
  } catch (e: any) {
    results.push({ name: 'Admin cannot create CEO', passed: false, error: e.message });
  }

  try {
    const ceoToken = await signJwt(
      { sub: 'acc_ceo', accountType: 'company', role: 'ceo', level: 65, companyId: 'comp_acme', countryId: 'KE', authVersion: 1, aud: 'housika-api' },
      secret
    );
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/company/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ceoToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'mgr@acme.com', name: 'New Manager', role: 'manager', password: 'password123' }),
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 201 && body.data?.role === 'manager';
    results.push({ name: 'CEO can create lower hierarchy staff (manager)', passed });
  } catch (e: any) {
    results.push({ name: 'CEO create manager', passed: false, error: e.message });
  }

  return results;
}
