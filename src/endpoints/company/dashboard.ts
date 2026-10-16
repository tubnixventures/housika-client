import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { requireCompany } from '../../middlewares/require-company';
import { getCompanyPermissions } from '../../connectors/d1';
import { cosmosQuery } from '../../connectors/cosmos';
import { PropertyDoc, UnitDoc, BookingDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';

export async function handleCompanyDashboard(
  _req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  requireCompany(auth);
  const companyId = auth.companyId!;

  const permissions = await getCompanyPermissions(env, companyId, auth.id);
  const properties = await cosmosQuery<PropertyDoc>(env, 'Properties', (p) => p.landlordId === companyId, 50);
  const units = await cosmosQuery<UnitDoc>(env, 'Units', (u) => u.landlordId === companyId, 100);
  const bookings = await cosmosQuery<BookingDoc>(env, 'Bookings', (b) => b.landlordId === companyId, 100);

  const pendingBookings = bookings.filter((b) => b.status === 'awaiting_landlord_approval').length;
  const activeProperties = properties.filter((p) => p.status === 'active').length;
  const availableUnits = units.filter((u) => u.status === 'available').length;

  return jsonOk(
    {
      companyId,
      caller: { id: auth.id, email: auth.email, role: auth.role, level: auth.level },
      effectivePermissions: permissions,
      counts: {
        totalProperties: properties.length,
        activeProperties,
        totalUnits: units.length,
        availableUnits,
        totalBookings: bookings.length,
        pendingBookings,
      },
    },
    'Company dashboard retrieved successfully',
    200
  );
}
