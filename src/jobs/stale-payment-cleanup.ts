import { Env } from '../types/env';
import { BookingDoc } from '../types/cosmos';
import { PaymentDoc } from '../types/cosmos-extra';
import { cosmosQuery, cosmosUpdate } from '../connectors/cosmos';
import { recordConcern } from './concerns';

export async function cleanupStaleUnpaidBookings(env: Env): Promise<number> {
  const ttlMin = parseInt(env.BOOKING_UNPAID_TTL_MINUTES || '30', 10);
  const cutoffTime = new Date(Date.now() - ttlMin * 60 * 1000).toISOString();

  const staleBookings = await cosmosQuery<BookingDoc>(
    env,
    'Bookings',
    (b) =>
      (b.status === 'draft' || b.status === 'pending_payment') &&
      b.createdAt <= cutoffTime,
    50
  );

  let cleaned = 0;
  for (const b of staleBookings) {
    await cosmosUpdate<BookingDoc>(env, 'Bookings', b.tenantId, b.id, {
      status: 'expired',
    });

    const payments = await cosmosQuery<PaymentDoc>(
      env,
      'Payments',
      (p) => p.docId === b.id && p.status === 'pending',
      1
    );
    if (payments[0]) {
      await cosmosUpdate(env, 'Payments', payments[0].country, payments[0].id, {
        status: 'abandoned',
      });
    }

    await recordConcern(env, {
      accountId: b.tenantId,
      docId: b.id,
      reason: 'booking_stale_unpaid_deleted',
      metadata: { createdAt: b.createdAt, expiredAt: new Date().toISOString() },
    });
    cleaned++;
  }

  return cleaned;
}
