import { Env } from '../../types/env';
import { verifyPaystackSignature } from '../../connectors/paystack';
import { applyPaystackSuccess } from './apply-success';
import { jsonErr } from '../../helpers/response';
import { ErrorCodes } from '../../types/errors';
import { cosmosQuery, cosmosUpdate } from '../../connectors/cosmos';
import { PaymentDoc } from '../../types/cosmos-extra';

export async function handlePaystackWebhook(req: Request, env: Env): Promise<Response> {
  const secret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY || 'dev_paystack_webhook_secret';
  const signature = req.headers.get('x-paystack-signature') || '';
  const rawBody = await req.text();

  const isValid = await verifyPaystackSignature(secret, rawBody, signature);
  if (!isValid) {
    return jsonErr(ErrorCodes.WEBHOOK_INVALID, 'Invalid Paystack webhook signature', 401);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonErr(ErrorCodes.WEBHOOK_INVALID, 'Malformed webhook JSON payload', 400);
  }

  const eventId = event?.data?.id ? String(event.data.id) : null;
  const reference = event?.data?.reference;

  if (eventId && env.KV_IDEMPOTENCY) {
    const key = `webhook:paystack:${eventId}`;
    const alreadyProcessed = await env.KV_IDEMPOTENCY.get(key);
    if (alreadyProcessed) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await env.KV_IDEMPOTENCY.put(key, '1', { expirationTtl: 7 * 86400 });
  }

  if (event.event === 'charge.success' && reference) {
    await applyPaystackSuccess(env, reference, eventId || undefined);
  } else if (event.event === 'charge.failed' && reference) {
    const payments = await cosmosQuery<PaymentDoc>(env, 'Payments', (p) => p.gatewayRef === reference, 1);
    if (payments[0]) {
      await cosmosUpdate(env, 'Payments', payments[0].country, payments[0].id, {
        status: 'failed',
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
