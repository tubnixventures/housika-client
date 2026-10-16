import { Env } from '../../types/env';
import { AuthContext } from '../../types/auth';
import { applyPaystackSuccess } from './apply-success';
import { jsonOk } from '../../helpers/response';
import { validationErr } from '../../helpers/errors';

export async function handlePaymentVerify(
  req: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');
  if (!reference) {
    validationErr('Payment reference query parameter is required');
  }

  const result = await applyPaystackSuccess(env, reference);
  return jsonOk(result, 'Payment verification applied', 200);
}
