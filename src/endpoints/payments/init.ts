import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { initPaystackTransaction } from '../../connectors/paystack';
import { cosmosCreate } from '../../connectors/cosmos';
import { PaymentDoc } from '../../types/cosmos-extra';
import { generateId } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { validationErr } from '../../helpers/errors';

export const PaymentInitSchema = z.object({
  purpose: z.enum(['listing_fee', 'booking_fee']),
  amount: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  email: z.string().email(),
  reference: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function handlePaymentInit(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    validationErr('Idempotency-Key header is required for payment initialization');
  }

  const body = await req.json();
  const parsed = PaymentInitSchema.parse(body);
  const reference = parsed.reference || generateId('payref');
  const paymentId = generateId('pay');

  const paystackResult = await initPaystackTransaction(env, {
    amount: parsed.amount,
    email: parsed.email,
    reference,
    currency: parsed.currency,
    metadata: { ...parsed.metadata, accountId: auth.id, paymentId },
  });

  const nowIso = new Date().toISOString();
  const paymentDoc: PaymentDoc = {
    id: paymentId,
    docType: 'payment',
    type: 'collection',
    purpose: parsed.purpose,
    accountId: auth.id,
    docId: (parsed.metadata?.docId as string) || paymentId,
    reason: parsed.purpose,
    amount: parsed.amount,
    currency: parsed.currency,
    country: (parsed.metadata?.country as string) || auth.countryId,
    gateway: 'paystack',
    gatewayRef: reference,
    authorizationUrl: paystackResult.authorizationUrl,
    accessCode: paystackResult.accessCode,
    status: 'pending',
    metadata: parsed.metadata,
    idempotencyKey,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await cosmosCreate(env, 'Payments', paymentDoc.country, paymentDoc);
  return jsonOk(
    {
      paymentId,
      reference,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
    },
    'Payment transaction initialized',
    201
  );
}
