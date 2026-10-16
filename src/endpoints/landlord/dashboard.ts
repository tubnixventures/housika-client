import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireLandlordOrCompany } from '../../middlewares/require-landlord';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosQuery } from '../../connectors/cosmos';
import { PropertyDoc, UnitDoc, BookingDoc } from '../../types/cosmos';
import { ChatDoc } from '../../types/cosmos-extra';
import { jsonOk } from '../../helpers/response';

export async function handleLandlordDashboard(
  _req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireLandlordOrCompany(auth);
  const landlordId = resolveLandlordId(auth);

  const properties = await cosmosQuery<PropertyDoc>(env, 'Properties', (p) => p.landlordId === landlordId, 100);
  const units = await cosmosQuery<UnitDoc>(env, 'Units', (u) => u.landlordId === landlordId, 200);
  const bookings = await cosmosQuery<BookingDoc>(env, 'Bookings', (b) => b.landlordId === landlordId, 200);
  const chats = await cosmosQuery<ChatDoc>(env, 'Chats', (c) => c.landlordId === landlordId, 100);

  const openBookings = bookings.filter((b) => b.status === 'awaiting_landlord_approval').length;
  const activeProperties = properties.filter((p) => p.status === 'active').length;
  const availableUnits = units.filter((u) => u.status === 'available').length;

  return jsonOk(
    {
      landlordId,
      counts: {
        totalProperties: properties.length,
        activeProperties,
        totalUnits: units.length,
        availableUnits,
        totalBookings: bookings.length,
        openBookings,
        activeChats: chats.length,
      },
    },
    'Landlord dashboard retrieved successfully',
    200
  );
}
