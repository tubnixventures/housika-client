import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosQuery } from '../../connectors/cosmos';
import { PropertyDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';

export async function handlePropertyList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const properties = await cosmosQuery<PropertyDoc>(
    env,
    'Properties',
    (p) => p.landlordId === landlordId,
    limit
  );

  return jsonOk(properties, 'Landlord properties retrieved', 200, {
    pageSize: properties.length,
  });
}
