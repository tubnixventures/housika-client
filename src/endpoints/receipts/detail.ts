import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { resolveLandlordId } from '../../helpers/landlord-id';
import { ReceiptDoc } from '../../types/cosmos-extra';
import { cosmosRead } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handleReceiptDetail(
  _req: Request,
  env: Env,
  auth: AuthContext,
  receiptId: string
): Promise<Response> {
  const landlordId = resolveLandlordId(auth);
  const receipt = await cosmosRead<ReceiptDoc>(env, 'Receipts', '', receiptId);
  if (!receipt) notFound('Receipt not found');

  if (receipt.landlordId !== landlordId && receipt.tenantName !== auth.id) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this receipt');
  }

  return jsonOk(receipt, 'Receipt details retrieved', 200);
}
