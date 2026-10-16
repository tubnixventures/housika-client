import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { UnitDoc } from '../../types/cosmos';
import { cosmosRead, cosmosUpdate } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleUnitGetOrPatch(
  req: Request,
  env: Env,
  auth: AuthContext,
  unitId: string
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const unit = await cosmosRead<UnitDoc>(env, 'Units', '', unitId);
  if (!unit) notFound('Unit not found');
  if (unit.landlordId !== landlordId) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this unit');
  }

  if (req.method === 'PATCH') {
    const body = (await req.json()) as any;
    const allowed = ['unitNumber', 'amount', 'period', 'imageKeys'];
    const patch: Partial<UnitDoc> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) (patch as any)[k] = body[k];
    }
    const updated = await cosmosUpdate<UnitDoc>(env, 'Units', unit.country, unitId, patch);
    return jsonOk(updated, 'Unit updated successfully', 200);
  }

  return jsonOk(unit, 'Unit retrieved successfully', 200);
}
