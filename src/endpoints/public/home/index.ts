import { Env } from '../../../types/env';
import { CategoryEnum } from '../../../types/categories';
import { UnitDoc } from '../../../types/cosmos';
import { cosmosQuery } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';
import { getCachedResponse, putCachedResponse } from '../../../utils/cache';

export async function handlePublicHome(req: Request, env: Env): Promise<Response> {
  const cached = await getCachedResponse(req);
  if (cached) return cached;

  const url = new URL(req.url);
  const country = url.searchParams.get('country') || 'KE';

  const allAvailable = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => u.country === country && u.status === 'available',
    100
  );

  const byCategory: Record<string, UnitDoc[]> = {};
  for (const cat of CategoryEnum.options) {
    byCategory[cat] = [];
  }

  for (const unit of allAvailable) {
    if (byCategory[unit.category] && byCategory[unit.category].length < 5) {
      byCategory[unit.category].push({
        ...unit,
        exactLocation: null,
      });
    }
  }

  const res = jsonOk(
    { country, categories: byCategory },
    'Public home feed retrieved',
    200
  );
  return await putCachedResponse(req, res, 90);
}
