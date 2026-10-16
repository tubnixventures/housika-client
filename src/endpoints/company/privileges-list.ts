import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { jsonOk } from '../../helpers/response';

export async function handleCompanyPrivilegesList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;
  const url = new URL(req.url);
  const staffId = url.searchParams.get('staffId');

  let privileges: any[] = [];
  if (env.DB_COMPANY_PERMISSIONS) {
    if (staffId) {
      const res = await env.DB_COMPANY_PERMISSIONS.prepare(
        'SELECT permission, assigned_by, created_at FROM company_permissions WHERE company_id = ? AND account_id = ?'
      ).bind(companyId, staffId).all();
      privileges = res.results || [];
    } else {
      const res = await env.DB_COMPANY_PERMISSIONS.prepare(
        'SELECT account_id, permission, assigned_by, created_at FROM company_permissions WHERE company_id = ?'
      ).bind(companyId).all();
      privileges = res.results || [];
    }
  }

  return jsonOk(privileges, 'Company privileges retrieved', 200);
}
