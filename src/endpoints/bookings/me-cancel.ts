import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireIndividual } from '../../middlewares/require-individual';
import { BookingDoc } from '../../types/cosmos';
import { cosmosRead, cosmosUpdate } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden, conflict } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleBookingsMeCancel(
  _req: Request,
  env: Env,
  auth: AuthContext,
  bookingId: string
): Promise<Response> {
  requireIndividual(auth);
  const booking = await cosmosRead<BookingDoc>(env, 'Bookings', '', bookingId);
  if (!booking) notFound('Booking not found');
  if (booking.tenantId !== auth.id) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this booking');
  }

  const cancellableStatuses = ['draft', 'pending_payment', 'awaiting_landlord_approval'];
  if (!cancellableStatuses.includes(booking.status)) {
    conflict(`Booking in status '${booking.status}' cannot be cancelled by tenant`);
  }

  const nowIso = new Date().toISOString();
  const updated = await cosmosUpdate<BookingDoc>(env, 'Bookings', auth.id, bookingId, {
    status: 'cancelled_by_tenant',
    cancelledAt: nowIso,
  });

  return jsonOk(updated, 'You cancelled this booking', 200);
}
