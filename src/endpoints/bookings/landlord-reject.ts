import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { BookingDoc } from '../../types/cosmos';
import { cosmosRead, cosmosUpdate } from '../../connectors/cosmos';
import { sendZeptoEmail } from '../../connectors/zeptomail';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden, conflict } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleLandlordBookingReject(
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
    conflict(`Cannot reject booking in status '${booking.status}'`);
  }

  const nowIso = new Date().toISOString();
  const updated = await cosmosUpdate<BookingDoc>(env, 'Bookings', booking.tenantId, bookingId, {
    status: 'rejected',
    rejectedAt: nowIso,
  });

  await sendZeptoEmail(env, {
    to: [{ email: `${booking.tenantId}@example.com` }],
    subject: `Booking Declined #${booking.id}`,
    htmlBody: `<p>Your booking request for unit <b>${booking.unitId}</b> was declined.</p>`,
  });

  return jsonOk(updated, 'Landlord declined this booking', 200);
}
