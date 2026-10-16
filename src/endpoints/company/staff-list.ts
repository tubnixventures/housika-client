import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { jsonOk } from '../../helpers/response';

export async function handleCompanyStaffList(
  _req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  let staffList: any[] = [];
  if (env.DB_ACCOUNTS) {
    const res = await env.DB_ACCOUNTS.prepare(
      'SELECT id, email, phone_number, role, level, status, created_at FROM accounts WHERE company_id = ?'
    )
      .bind(companyId)
      .all();
    staffList = res.results || [];
  } else {
    staffList = [
      {
        id: auth.id,
        email: auth.email,
        role: auth.role,
        level: auth.level,
        status: auth.status,
      },
    ];
  }

  return jsonOk(staffList, 'Company staff list retrieved', 200, { pageSize: staffList.length });
}
