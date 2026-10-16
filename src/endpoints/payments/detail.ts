import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { PaymentDoc } from '../../types/cosmos-extra';
import { cosmosRead } from '../../connectors/cosmos';
import { jsonOk } from '../../helpers/response';
import { notFound, forbidden } from '../../helpers/errors';
import { ErrorCodes } from '../../types/errors';

export async function handlePaymentDetail(
  _req: Request,
  env: Env,
  auth: AuthContext,
  paymentId: string
): Promise<Response> {
  const payment = await cosmosRead<PaymentDoc>(env, 'Payments', '', paymentId);
  if (!payment) notFound('Payment not found');

  if (payment.accountId !== auth.id && auth.companyId !== payment.accountId) {
    forbidden(ErrorCodes.PERMISSION_DENIED, 'Access denied to this payment record');
  }

  const safeDto = {
    id: payment.id,
    purpose: payment.purpose,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    gatewayRef: payment.gatewayRef,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };

  return jsonOk(safeDto, 'Payment details retrieved', 200);
}
