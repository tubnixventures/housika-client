import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireIndividual } from '../../middlewares/require-individual';
import { cosmosQuery } from '../../connectors/cosmos';
import { BookingDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';

export async function handleBookingsMeList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireIndividual(auth);
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const bookings = await cosmosQuery<BookingDoc>(
    env,
    'Bookings',
    (b) => b.tenantId === auth.id,
    limit
  );

  return jsonOk(bookings, 'User bookings retrieved', 200, { pageSize: bookings.length });
}
