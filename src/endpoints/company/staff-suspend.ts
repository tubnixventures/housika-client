import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { jsonOk } from '../../helpers/response';
import { forbidden, notFound } from '../../helpers/errors';
import { recordAuditEvent } from '../../helpers/audit';
import { ErrorCodes } from '../../types/errors';

export async function handleCompanyStaffSuspend(
  _req: Request,
  env: Env,
  auth: AuthContext,
  staffId: string
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  if (env.DB_ACCOUNTS) {
    const target = await env.DB_ACCOUNTS.prepare(
      'SELECT id, level, role, status FROM accounts WHERE id = ? AND company_id = ?'
    ).bind(staffId, companyId).first<any>();

    if (!target) notFound('Staff member not found');
    if (target.level >= auth.level) {
      forbidden(ErrorCodes.HIERARCHY_RESTRICTED, 'Cannot suspend staff with level >= your level');
    }

    await env.DB_ACCOUNTS.prepare(
      "UPDATE accounts SET status = 'suspended', auth_version = auth_version + 1, updated_at = ? WHERE id = ?"
    ).bind(Math.floor(Date.now() / 1000), staffId).run();
  }

  await recordAuditEvent(env, {
    accountId: auth.id,
    action: 'company_staff_suspend',
    result: 'success',
    docId: staffId,
    metadata: { suspendedStaffId: staffId, companyId },
  });

  return jsonOk({ staffId, status: 'suspended' }, 'Staff suspended successfully', 200);
}
