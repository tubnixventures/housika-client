import { jsonOk } from '../../helpers/response';
import { Env } from '../../types/env';

export async function handleHealth(req: Request, env: Env): Promise<Response> {
  const data = {
    status: 'healthy',
    service: 'housika-client-backend',
    version: '1.4',
    time: new Date().toISOString(),
    env: {
      hasJwtSecret: Boolean(env.JWT_ACCESS_SECRET),
      hasPaystackSecret: Boolean(env.PAYSTACK_SECRET_KEY),
      hasCosmos: Boolean(env.COSMOS_ENDPOINT),
      hasAnalytics: Boolean(env.housika_client_analytics),
    },
  };
  return jsonOk(data, 'Service is operational', 200);
}
