import { Env } from '../../../types/env';
import { UnitDoc } from '../../../types/cosmos';
import { cosmosQuery } from '../../../connectors/cosmos';
import { parseSearchWithAi } from '../../../connectors/ai-search';
import { SearchQuerySchema } from './schema';
import { jsonOk } from '../../../helpers/response';
import { checkRateLimit } from '../../../middlewares/rate-limit';

export async function handlePublicSearch(req: Request, env: Env): Promise<Response> {
  const ip = req.headers.get('cf-connecting-ip') || 'anonymous_ip';
  await checkRateLimit(env, `rl:ip:${ip}:search`, 30, 60);

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const parsed = SearchQuerySchema.parse(rawParams);

  let effectiveCategory = parsed.category;
  let effectiveMax = parsed.maxAmount;
  let effectiveMin = parsed.minAmount;

  if (parsed.q) {
    const aiFilters = await parseSearchWithAi(env, parsed.q);
    if (!effectiveCategory && aiFilters.category) effectiveCategory = aiFilters.category;
    if (!effectiveMax && aiFilters.maxAmount) effectiveMax = aiFilters.maxAmount;
    if (!effectiveMin && aiFilters.minAmount) effectiveMin = aiFilters.minAmount;
  }

  const units = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => {
      if (u.status !== 'available') return false;
      if (parsed.country && u.country !== parsed.country) return false;
      if (effectiveCategory && u.category !== effectiveCategory) return false;
      if (effectiveMin && u.amount < effectiveMin) return false;
      if (effectiveMax && u.amount > effectiveMax) return false;
      return true;
    },
    parsed.limit
  );

  const sanitized = units.map((u) => ({ ...u, exactLocation: null }));
  return jsonOk(sanitized, 'Search completed successfully', 200, {
    pageSize: sanitized.length,
  });
}
