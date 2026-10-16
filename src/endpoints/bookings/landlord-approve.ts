import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { BookingDoc, UnitDoc } from '../../types/cosmos';
import { ReceiptDoc } from '../../types/cosmos-extra';
import { cosmosRead, cosmosUpdate, cosmosCreate } from '../../connectors/cosmos';
import { sendZeptoEmail } from '../../connectors/zeptomail';
import { generateId, generateVerifyCode } from '../../helpers/ids';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden, conflict } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleLandlordBookingApprove(
  _req: Request,
  env: Env,
  auth: AuthContext,
  bookingId: string
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const booking = await cosmosRead<BookingDoc>(env, 'Bookings', '', bookingId);
  if (!booking) notFound('Booking not found');
  if (booking.landlordId !== landlordId) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this booking');
  }

  if (booking.status !== 'awaiting_landlord_approval') {
    conflict(`Cannot approve booking in status '${booking.status}'`);
  }

  const nowIso = new Date().toISOString();
  const updated = await cosmosUpdate<BookingDoc>(env, 'Bookings', booking.tenantId, bookingId, {
    status: 'booked',
    approvedAt: nowIso,
  });

  await cosmosUpdate<UnitDoc>(env, 'Units', booking.country, booking.unitId, {
    status: 'booked',
  });

  const receipt: ReceiptDoc = {
    id: generateId('rcpt'),
    docType: 'receipt',
    landlordId,
    tenantName: booking.tenantId,
    amount: booking.bookingFeeAmount,
    balance: 0,
    paymentMethod: 'paystack',
    unitId: booking.unitId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    currency: booking.currency,
    verifyCode: generateVerifyCode(),
    createdAt: nowIso,
  };
  await cosmosCreate(env, 'Receipts', landlordId, receipt);

  await sendZeptoEmail(env, {
    to: [{ email: `${booking.tenantId}@example.com` }],
    subject: `Booking Confirmed #${booking.id}`,
    htmlBody: `<p>Your booking for unit <b>${booking.unitId}</b> has been approved!</p>`,
  });

  return jsonOk(updated, 'Booking confirmed', 200);
}
