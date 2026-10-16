import { Env } from '../../../types/env';
import { CategoryEnum } from '../../../types/categories';
import { UnitDoc } from '../../../types/cosmos';
import { cosmosQuery } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';
import { getCachedResponse, putCachedResponse } from '../../../utils/cache';
import { validationErr } from '../../../helpers/errors';

export async function handlePublicCategory(
  req: Request,
  env: Env,
  categoryParam: string
): Promise<Response> {
  const cached = await getCachedResponse(req);
  if (cached) return cached;

  const parseResult = CategoryEnum.safeParse(categoryParam);
  if (!parseResult.success) {
    validationErr(`Invalid category: ${categoryParam}`);
  }
  const category = parseResult.data;

  const url = new URL(req.url);
  const country = url.searchParams.get('country') || 'KE';

  const units = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => u.category === category && u.status === 'available' && u.country === country,
    25
  );

  const sanitized = units.map((u) => ({ ...u, exactLocation: null }));
  const res = jsonOk(
    { category, country, units: sanitized },
    `Units for category ${category}`,
    200
  );
  return await putCachedResponse(req, res, 60);
}
