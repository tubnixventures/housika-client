import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosQuery } from '../../connectors/cosmos';
import { BookingDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';

export async function handleLandlordBookingsList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const bookings = await cosmosQuery<BookingDoc>(
    env,
    'Bookings',
    (b) => {
      if (b.landlordId !== landlordId) return false;
      if (status && b.status !== status) return false;
      return true;
    },
    limit
  );

  return jsonOk(bookings, 'Landlord incoming bookings retrieved', 200, {
    pageSize: bookings.length,
  });
}
