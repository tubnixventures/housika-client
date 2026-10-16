import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosRead, cosmosUpdate } from '../../connectors/cosmos';
import { PropertyDoc } from '../../types/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handlePropertyGetOrUpdate(
  req: Request,
  env: Env,
  auth: AuthContext,
  propertyId: string
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const property = await cosmosRead<PropertyDoc>(env, 'Properties', '', propertyId);
  if (!property) notFound('Property not found');
  if (property.landlordId !== landlordId) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this property');
  }

  if (req.method === 'PATCH') {
    const body = (await req.json()) as any;
    const allowed = ['location', 'exactLocation', 'lat', 'long', 'videoKey', 'title', 'description'];
    const patch: Partial<PropertyDoc> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) (patch as any)[key] = body[key];
    }
    const updated = await cosmosUpdate<PropertyDoc>(env, 'Properties', property.country, propertyId, patch);
    return jsonOk(updated, 'Property updated successfully', 200);
  }

  return jsonOk(property, 'Property retrieved successfully', 200);
}
