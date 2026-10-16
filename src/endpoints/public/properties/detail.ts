import { Env } from '../../../types/env';
import { PropertyDoc, UnitDoc } from '../../../types/cosmos';
import { cosmosRead, cosmosQuery } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';
import { notFound } from '../../../helpers/errors';
import { getCachedResponse, putCachedResponse } from '../../../utils/cache';

export async function handlePublicPropertyDetail(
  req: Request,
  env: Env,
  propertyId: string
): Promise<Response> {
  const cached = await getCachedResponse(req);
  if (cached) return cached;

  const property = await cosmosRead<PropertyDoc>(env, 'Properties', '', propertyId);
  if (!property || property.status !== 'active') {
    notFound('Property not found or not active');
  }

  const units = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => u.propertyId === propertyId && u.status === 'available',
    50
  );

  const sanitizedProperty = {
    ...property,
    exactLocation: null,
  };
  const sanitizedUnits = units.map((u) => ({ ...u, exactLocation: null }));

  const res = jsonOk(
    { property: sanitizedProperty, units: sanitizedUnits },
    'Property and available units retrieved',
    200
  );
  return await putCachedResponse(req, res, 45);
}
