import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { recordAuditEvent } from '../../helpers/audit';
import { jsonOk } from '../../helpers/response';
import { validationErr, notFound } from '../../helpers/errors';

export const TenantVerifySchema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().length(6),
});

export async function handleTenantLookupVerify(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const body = await req.json();
  const { challengeId, otp } = TenantVerifySchema.parse(body);

  let challenge: any = null;
  if (env.KV_OTP) {
    const raw = await env.KV_OTP.get(`otp:${challengeId}`, { type: 'json' });
    challenge = raw;
  }

  if (!challenge) notFound('OTP challenge expired or not found');
  if (challenge.attempts >= challenge.maxAttempts) {
    validationErr('Maximum OTP verification attempts exceeded');
  }

  if (challenge.code !== otp) {
    challenge.attempts += 1;
    if (env.KV_OTP) {
      await env.KV_OTP.put(`otp:${challengeId}`, JSON.stringify(challenge), { expirationTtl: 300 });
    }
    await recordAuditEvent(env, {
      accountId: auth.id,
      action: 'tenant_lookup_verify',
      result: 'failure',
      reasonCode: 'otp_invalid',
      docId: challengeId,
    });
    validationErr('Invalid OTP code');
  }

  if (env.KV_OTP) await env.KV_OTP.delete(`otp:${challengeId}`);

  await recordAuditEvent(env, {
    accountId: auth.id,
    action: 'tenant_lookup_verify',
    result: 'success',
    docId: challengeId,
    metadata: { targetEmail: challenge.targetEmail },
  });

  const tenantProfile = {
    accountId: `acc_${challenge.targetEmail.split('@')[0]}`,
    name: 'Verified Tenant User',
    email: challenge.targetEmail,
    isVerified: true,
  };

  return jsonOk(tenantProfile, 'Tenant verified successfully', 200);
}
