import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { generateId, generateOtpCode } from '../../helpers/ids';
import { sendZeptoEmail } from '../../connectors/zeptomail';
import { recordAuditEvent } from '../../helpers/audit';
import { jsonOk } from '../../helpers/response';
import { validationErr } from '../../helpers/errors';
import { checkRateLimit } from '../../middlewares/rate-limit';

export const TenantLookupSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
}).refine(data => data.email || data.phoneNumber, {
  message: 'At least one of email or phoneNumber is required',
});

export async function handleTenantLookup(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;
  await checkRateLimit(env, `rl:co:${companyId}:tenant_lookup`, 10, 3600);

  const body = await req.json();
  const parsed = TenantLookupSchema.parse(body);
  const targetEmail = parsed.email || `${parsed.phoneNumber}@example.com`;

  const challengeId = generateId('otp_chal');
  const otp = generateOtpCode();
  const expiresAt = Math.floor(Date.now() / 1000) + 600;

  const challengeData = {
    id: challengeId,
    purpose: 'tenant_lookup',
    targetEmail,
    requesterId: auth.id,
    companyId,
    code: otp,
    attempts: 0,
    maxAttempts: 5,
    expiresAt,
  };

  if (env.KV_OTP) {
    await env.KV_OTP.put(`otp:${challengeId}`, JSON.stringify(challengeData), { expirationTtl: 600 });
  }

  await sendZeptoEmail(env, {
    to: [{ email: targetEmail }],
    subject: 'Housika Security Code for Verification',
    htmlBody: `<p>Your 6-digit verification code is: <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });

  await recordAuditEvent(env, {
    accountId: auth.id,
    action: 'tenant_lookup_initiated',
    result: 'success',
    docId: challengeId,
    metadata: { companyId, targetEmail },
  });

  return jsonOk(
    { challengeId, message: `OTP sent to ${targetEmail}` },
    'OTP verification challenge initiated',
    200
  );
}
