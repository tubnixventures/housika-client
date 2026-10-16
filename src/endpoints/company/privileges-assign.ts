import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { COMPANY_PERMISSIONS, isValidCompanyPermission } from '../../types/permissions';
import { jsonOk } from '../../helpers/response';
import { validationErr } from '../../helpers/errors';
import { recordAuditEvent } from '../../helpers/audit';

export const PrivilegesAssignSchema = z.object({
  permissions: z.array(z.string()),
  reason: z.string().min(3),
});

export async function handleCompanyPrivilegesAssign(
  req: Request,
  env: Env,
  auth: AuthContext,
  staffId: string
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  const body = await req.json();
  const parsed = PrivilegesAssignSchema.parse(body);

  for (const p of parsed.permissions) {
    if (!isValidCompanyPermission(p)) {
      validationErr(`Invalid company permission: ${p}. Must be one of ${COMPANY_PERMISSIONS.join(', ')}`);
    }
  }

  if (env.DB_COMPANY_PERMISSIONS) {
    await env.DB_COMPANY_PERMISSIONS.prepare(
      'DELETE FROM company_permissions WHERE company_id = ? AND account_id = ?'
    ).bind(companyId, staffId).run();

    const now = Math.floor(Date.now() / 1000);
    for (const p of parsed.permissions) {
      await env.DB_COMPANY_PERMISSIONS.prepare(
        'INSERT INTO company_permissions (company_id, account_id, permission, assigned_by, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(companyId, staffId, p, auth.id, now).run();
    }
  }

  await recordAuditEvent(env, {
    accountId: auth.id,
    action: 'company_privileges_assign',
    result: 'success',
    docId: staffId,
    metadata: { permissions: parsed.permissions, reason: parsed.reason },
  });

  return jsonOk({ staffId, permissions: parsed.permissions }, 'Privileges assigned successfully', 200);
}
