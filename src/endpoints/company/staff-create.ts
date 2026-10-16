import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext, COMPANY_ROLE_LEVELS } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { generateId } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { forbidden, conflict, validationErr } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export const StaffCreateSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  name: z.string().min(2),
  displayName: z.string().optional(),
  role: z.enum(['ceo', 'admin', 'manager', 'customercare']),
  password: z.string().min(8),
});

export async function handleCompanyStaffCreate(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  const body = await req.json();
  const parsed = StaffCreateSchema.parse(body);

  if ((parsed.role as string) === 'root') {
    forbidden(ErrorCodes.ROLE_FORBIDDEN, 'Creation of root role via API is disabled');
  }

  const targetLevel = COMPANY_ROLE_LEVELS[parsed.role];
  if (targetLevel >= auth.level) {
    forbidden(
      ErrorCodes.HIERARCHY_RESTRICTED,
      `Cannot create staff with level (${targetLevel}) >= your level (${auth.level})`
    );
  }

  if (parsed.role === 'ceo' && env.DB_ACCOUNTS) {
    const existingCeo = await env.DB_ACCOUNTS.prepare(
      "SELECT id FROM accounts WHERE company_id = ? AND role = 'ceo' AND status = 'active'"
    )
      .bind(companyId)
      .first();
    if (existingCeo) {
      conflict('A company can have at most one active CEO');
    }
  }

  const staffId = generateId('acc_staff');
  const now = Math.floor(Date.now() / 1000);

  if (env.DB_ACCOUNTS) {
    await env.DB_ACCOUNTS.prepare(
      `INSERT INTO accounts (id, email, phone_number, account_type, role, level, status, company_id, country_id, auth_version, created_at, updated_at)
       VALUES (?, ?, ?, 'company', ?, ?, 'active', ?, ?, 1, ?, ?)`
    )
      .bind(
        staffId,
        parsed.email,
        parsed.phoneNumber || null,
        parsed.role,
        targetLevel,
        companyId,
        auth.countryId,
        now,
        now
      )
      .run();
  }

  const createdStaff = {
    id: staffId,
    email: parsed.email,
    phoneNumber: parsed.phoneNumber,
    name: parsed.name,
    role: parsed.role,
    level: targetLevel,
    companyId,
    status: 'active',
  };

  return jsonOk(createdStaff, 'Company staff created successfully', 201);
}
