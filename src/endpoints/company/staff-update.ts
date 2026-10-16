import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext, COMPANY_ROLE_LEVELS } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { jsonOk } from '../../helpers/response';
import { forbidden, conflict, notFound } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export const StaffRoleUpdateSchema = z.object({
  role: z.enum(['ceo', 'admin', 'manager', 'customercare']),
});

export async function handleCompanyStaffRoleUpdate(
  req: Request,
  env: Env,
  auth: AuthContext,
  staffId: string
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  const body = await req.json();
  const { role: newRole } = StaffRoleUpdateSchema.parse(body);
  const newLevel = COMPANY_ROLE_LEVELS[newRole];

  if (newLevel >= auth.level) {
    forbidden(ErrorCodes.HIERARCHY_RESTRICTED, 'Cannot assign role >= your hierarchy level');
  }

  if (env.DB_ACCOUNTS) {
    const target = await env.DB_ACCOUNTS.prepare(
      'SELECT id, level, role FROM accounts WHERE id = ? AND company_id = ?'
    ).bind(staffId, companyId).first<any>();

    if (!target) notFound('Staff member not found');
    if (target.level >= auth.level) {
      forbidden(ErrorCodes.HIERARCHY_RESTRICTED, 'Cannot manage staff with level >= your level');
    }

    if (newRole === 'ceo') {
      const activeCeo = await env.DB_ACCOUNTS.prepare(
        "SELECT id FROM accounts WHERE company_id = ? AND role = 'ceo' AND status = 'active' AND id != ?"
      ).bind(companyId, staffId).first();
      if (activeCeo) conflict('Company already has an active CEO');
    }

    await env.DB_ACCOUNTS.prepare(
      'UPDATE accounts SET role = ?, level = ?, auth_version = auth_version + 1, updated_at = ? WHERE id = ?'
    ).bind(newRole, newLevel, Math.floor(Date.now() / 1000), staffId).run();
  }

  return jsonOk({ staffId, role: newRole, level: newLevel }, 'Staff role updated successfully', 200);
}
