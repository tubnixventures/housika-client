import { Env } from '../../../types/env';
import { UnitDoc } from '../../../types/cosmos';
import { cosmosRead } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';
import { notFound } from '../../../helpers/errors';
import { getCachedResponse, putCachedResponse } from '../../../utils/cache';

export async function handlePublicUnitDetail(
  req: Request,
  env: Env,
  unitId: string
): Promise<Response> {
  const cached = await getCachedResponse(req);
  if (cached) return cached;

  const unit = await cosmosRead<UnitDoc>(env, 'Units', '', unitId);
  if (!unit || unit.status !== 'available') {
    notFound('Unit not found or not available');
  }

  const sanitized = {
    ...unit,
    exactLocation: null,
  };

  const res = jsonOk(sanitized, 'Unit details retrieved', 200);
  return await putCachedResponse(req, res, 30);
}
