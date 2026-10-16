import { Env } from '../../../types/env';
import { UnitDoc } from '../../../types/cosmos';
import { cosmosQuery } from '../../../connectors/cosmos';
import { jsonOk } from '../../../helpers/response';

export async function handlePublicUnitsList(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const country = url.searchParams.get('country');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const units = await cosmosQuery<UnitDoc>(
    env,
    'Units',
    (u) => {
      if (u.status !== 'available') return false;
      if (country && u.country !== country) return false;
      return true;
    },
    limit
  );

  const sanitized = units.map((u) => ({ ...u, exactLocation: null }));
  return jsonOk(sanitized, 'Public units retrieved', 200, {
    pageSize: sanitized.length,
  });
}
