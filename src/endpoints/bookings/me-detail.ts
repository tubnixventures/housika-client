import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireIndividual } from '../../middlewares/require-individual';
import { BookingDoc } from '../../types/cosmos';
import { cosmosRead } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleBookingsMeDetail(
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

  return jsonOk(booking, 'Booking details retrieved', 200);
}
