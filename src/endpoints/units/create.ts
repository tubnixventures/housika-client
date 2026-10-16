import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { PropertyDoc, UnitDoc } from '../../types/cosmos';
import { cosmosRead, cosmosCreate } from '../../connectors/cosmos';
import { spreadPropertyToUnit } from '../../helpers/property-spread';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { CategoryEnum } from '../../types/categories';
import { ErrorCodes } from '../../types/errors';

export const UnitCreateSchema = z.object({
  propertyId: z.string().min(1),
  unitNumber: z.string().min(1),
  category: CategoryEnum,
  amount: z.number().int().positive(),
  period: z.enum(['night', 'week', 'month', 'year', 'sale']),
  imageKeys: z.array(z.string()).optional(),
});

export async function handleUnitCreate(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const body = await req.json();
  const parsed = UnitCreateSchema.parse(body);

  const property = await cosmosRead<PropertyDoc>(env, 'Properties', '', parsed.propertyId);
  if (!property) notFound('Property not found');
  if (property.landlordId !== landlordId) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'You do not own this property');
  }

  const nowIso = new Date().toISOString();
  const unit = spreadPropertyToUnit(property, 'KES', parsed, nowIso);
  await cosmosCreate<UnitDoc>(env, 'Units', property.country, unit);

  return jsonOk(unit, 'Unit created successfully', 201);
}
