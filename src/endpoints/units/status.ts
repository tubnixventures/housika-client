import { z } from 'zod';
import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { UnitDoc } from '../../types/cosmos';
import { cosmosRead, cosmosUpdate } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden, conflict } from '../../helpers/errors';
import { UnitStatusEnum } from '../../types/status';
import { ErrorCodes } from '../../types/errors';

export const UnitStatusPatchSchema = z.object({
  status: UnitStatusEnum,
});

export async function handleUnitStatusPatch(
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

  const body = await req.json();
  const { status: targetStatus } = UnitStatusPatchSchema.parse(body);

  const allowedTransitions: Record<string, string[]> = {
    available: ['unavailable', 'suspended', 'archived', 'reserved'],
    unavailable: ['available', 'archived'],
    reserved: ['available', 'booked'],
    suspended: ['available', 'archived'],
    draft: ['pending_payment'],
    pending_admin_approval: ['available'],
  };

  const allowed = allowedTransitions[unit.status] || [];
  if (!allowed.includes(targetStatus)) {
    conflict(`Illegal unit status transition from ${unit.status} to ${targetStatus}`);
  }

  const updated = await cosmosUpdate<UnitDoc>(env, 'Units', unit.country, unitId, {
    status: targetStatus,
  });

  return jsonOk(updated, `Unit status transitioned to ${targetStatus}`, 200);
}
