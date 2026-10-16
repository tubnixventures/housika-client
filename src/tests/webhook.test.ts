import worker from '../index';
import { hmacSha512 } from '../utils/crypto';
import { cosmosCreate, cosmosRead } from '../connectors/cosmos';
import { PaymentDoc } from '../types/cosmos-extra';
import { BookingDoc } from '../types/cosmos';

export async function runWebhookTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const webhookSecret = 'test_webhook_secret_99999';
  const env: any = { PAYSTACK_WEBHOOK_SECRET: webhookSecret };

  try {
    const rawBad = JSON.stringify({ event: 'charge.success' });
    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': 'bad_signature_hex' },
        body: rawBad,
      }),
      env
    );
    const body: any = await res.json();
    const passed = res.status === 401 && body.error?.code === 'WEBHOOK_INVALID';
    results.push({ name: 'Invalid signature rejected with 401 WEBHOOK_INVALID', passed });
  } catch (e: any) {
    results.push({ name: 'Invalid signature rejected', passed: false, error: e.message });
  }

  try {
    const ref = 'payref_webhook_test_1';
    const bookingId = 'book_webhook_test_1';

    await cosmosCreate(env, 'Bookings', 'tenant_1', {
      id: bookingId,
      docType: 'booking',
      unitId: 'unit_test',
      propertyId: 'prop_test',
      tenantId: 'tenant_1',
      landlordId: 'landlord_1',
      country: 'KE',
      category: 'one_bedroom',
      currency: 'KES',
      unitAmount: 2000000,
      bookingFeeAmount: 100000,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as BookingDoc);

    await cosmosCreate(env, 'Payments', 'KE', {
      id: 'pay_test_1',
      docType: 'payment',
      type: 'collection',
      purpose: 'booking_fee',
      accountId: 'tenant_1',
      docId: bookingId,
      reason: 'booking_fee',
      amount: 100000,
      currency: 'KES',
      country: 'KE',
      gateway: 'paystack',
      gatewayRef: ref,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as PaymentDoc);

    const validPayload = JSON.stringify({
      event: 'charge.success',
      data: { id: 1234567, reference: ref, status: 'success', amount: 100000, currency: 'KES' },
    });
    const validSig = await hmacSha512(webhookSecret, validPayload);

    const res = await worker.fetch(
      new Request('https://api.housika.com/client/api/v1/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': validSig },
        body: validPayload,
      }),
      env
    );

    const updatedBooking = await cosmosRead<BookingDoc>(env, 'Bookings', '', bookingId);
    const passed = res.status === 200 && updatedBooking?.status === 'awaiting_landlord_approval';
    results.push({ name: 'charge.success webhook transitions booking to awaiting_landlord_approval', passed });
  } catch (e: any) {
    results.push({ name: 'charge.success transitions booking', passed: false, error: e.message });
  }

  return results;
}
