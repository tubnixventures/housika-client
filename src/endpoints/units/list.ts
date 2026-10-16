import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosQuery } from '../../connectors/cosmos';
import { UnitDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';

export async function handleUnitList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const url = new URL(req.url);
  const propertyId = url.searchParams.get('propertyId');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const units = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => {
      if (u.landlordId !== landlordId) return false;
      if (propertyId && u.propertyId !== propertyId) return false;
      return true;
    },
    limit
  );

  return jsonOk(units, 'Landlord units retrieved', 200, { pageSize: units.length });
}
