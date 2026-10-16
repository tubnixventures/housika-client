import { Env } from '../../types/env';
import { PaymentDoc, ReceiptDoc } from '../../types/cosmos-extra';
import { PropertyDoc, UnitDoc, BookingDoc } from '../../types/cosmos';
import { cosmosQuery, cosmosUpdate, cosmosCreate } from '../../connectors/cosmos';
import { sendZeptoEmail } from '../../connectors/zeptomail';
import { sendInfobipWhatsApp } from '../../connectors/infobip';
import { recordAuditEvent } from '../../helpers/audit';
import { writeAnalyticsPoint } from '../../connectors/analytics-engine';
import { generateId, generateVerifyCode } from '../../helpers/ids';

export async function applyPaystackSuccess(
  env: Env,
  reference: string,
  gatewayEventId?: string
): Promise<{ success: boolean; duplicate?: boolean }> {
  const payments = await cosmosQuery<PaymentDoc>(env, 'Payments', (p) => p.gatewayRef === reference, 1);
  const payment = payments[0];
  if (!payment) return { success: false };
  if (payment.status === 'success') return { success: true, duplicate: true };

  const nowIso = new Date().toISOString();
  await cosmosUpdate<PaymentDoc>(env, 'Payments', payment.country, payment.id, {
    status: 'success',
    paidAt: nowIso,
    gatewayEventId: gatewayEventId || payment.gatewayEventId,
  });

  if (payment.purpose === 'listing_fee') {
    await cosmosUpdate<PropertyDoc>(env, 'Properties', payment.country, payment.docId, {
      status: 'pending_admin_approval',
      paid: true,
    });
    const units = await cosmosQuery<UnitDoc>(env, 'Units', (u) => u.propertyId === payment.docId, 100);
    for (const u of units) {
      await cosmosUpdate<UnitDoc>(env, 'Units', u.country, u.id, { status: 'pending_admin_approval' });
    }
  } else if (payment.purpose === 'booking_fee') {
    const booking = await cosmosUpdate<BookingDoc>(env, 'Bookings', '', payment.docId, {
      status: 'awaiting_landlord_approval',
      paidAt: nowIso,
    });
    if (booking) {
      await sendZeptoEmail(env, {
        to: [{ email: 'landlord@housika.com' }],
        subject: `New Paid Booking Request #${booking.id}`,
        htmlBody: `<p>A booking for unit <b>${booking.unitId}</b> is awaiting your approval.</p>`,
      });
      await sendInfobipWhatsApp(env, {
        toPhone: '+254700000000',
        messageText: `Housika: New paid booking ${booking.id} awaiting approval.`,
      });
    }
  }

  await recordAuditEvent(env, {
    accountId: payment.accountId,
    action: 'payment_success',
    result: 'success',
    docId: payment.id,
    metadata: { reference, purpose: payment.purpose, amount: payment.amount },
  });

  writeAnalyticsPoint(env, {
    path: '/webhooks/paystack',
    method: 'POST',
    status: 200,
    durationMs: 10,
    country: payment.country,
    actorId: payment.accountId,
    result: 'HTTP_SUCCESS',
  });

  return { success: true };
}
