import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { cosmosQuery } from '../../connectors/cosmos';
import { ReceiptDoc } from '../../types/cosmos-extra';
import { jsonOk } from '../../helpers/response';

export async function handleReceiptList(
  req: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 100);

  const receipts = await cosmosQuery<ReceiptDoc>(
    env,
    'Receipts',
    (r) => r.landlordId === landlordId,
    limit
  );

  return jsonOk(receipts, 'Landlord receipts retrieved', 200, {
    pageSize: receipts.length,
  });
}
