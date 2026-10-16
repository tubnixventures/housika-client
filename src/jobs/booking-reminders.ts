import { Env } from '../types/env';
import { BookingDoc } from '../types/cosmos';
import { cosmosQuery, cosmosUpdate } from '../connectors/cosmos';
import { sendZeptoEmail } from '../connectors/zeptomail';
import { sendInfobipWhatsApp } from '../connectors/infobip';
import { recordConcern } from './concerns';

export async function sendLandlordApprovalReminders(env: Env): Promise<number> {
  const reminderMin = parseInt(env.BOOKING_APPROVAL_REMINDER_AFTER_MINUTES || '30', 10);
  const cutoffTime = new Date(Date.now() - reminderMin * 60 * 1000).toISOString();

  const pendingApproval = await cosmosQuery<BookingDoc>(
    env,
    'Bookings',
    (b) =>
      b.status === 'awaiting_landlord_approval' &&
      b.paidAt != null &&
      b.paidAt <= cutoffTime &&
      !b.reminderSentAt,
    50
  );

  let reminded = 0;
  const nowIso = new Date().toISOString();

  for (const b of pendingApproval) {
    await sendZeptoEmail(env, {
      to: [{ email: `${b.landlordId}@example.com` }],
      subject: `Reminder: Booking #${b.id} Awaiting Approval`,
      htmlBody: `<p>Payment was confirmed for unit <b>${b.unitId}</b>. Please approve or decline this booking promptly.</p>`,
    });

    await sendInfobipWhatsApp(env, {
      toPhone: '+254700000000',
      messageText: `Housika Reminder: Paid booking ${b.id} is awaiting your approval.`,
    });

    await cosmosUpdate<BookingDoc>(env, 'Bookings', b.tenantId, b.id, {
      reminderSentAt: nowIso,
    });

    await recordConcern(env, {
      accountId: b.landlordId,
      docId: b.id,
      reason: 'booking_awaiting_approval_reminder',
      metadata: { paidAt: b.paidAt, reminderSentAt: nowIso },
    });
    reminded++;
  }

  return reminded;
}
