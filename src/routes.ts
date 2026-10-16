import { Env } from './types/env';
import { matchPublicRoutes } from './routes/public';
import { matchBookingRoutes } from './routes/bookings';
import { matchPropertyRoutes } from './routes/properties';
import { matchCompanyRoutes } from './routes/company';
import { matchServiceRoutes } from './routes/services';
import { handlePaystackWebhook } from './endpoints/payments/webhook';
import { authenticateRequest } from './middlewares/authenticate';
import { applySecurityHeaders, getOrCreateTraceId } from './middlewares/security-headers';
import { jsonErr } from './helpers/response';
import { AppError } from './helpers/errors';
import { writeAnalyticsPoint } from './connectors/analytics-engine';
import { logger } from './utils/logger';

export async function handleRequest(req: Request, env: Env): Promise<Response> {
  const start = Date.now();
  const traceId = getOrCreateTraceId(req);
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    const corsHeaders = new Headers();
    corsHeaders.set('Access-Control-Allow-Origin', env.CLIENT_FRONTEND_ORIGIN || '*');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, x-trace-id');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const publicMatch = await matchPublicRoutes(req, env, path);
    if (publicMatch) {
      applySecurityHeaders(publicMatch.headers);
      writeAnalytics(env, path, req.method, publicMatch.status, Date.now() - start, traceId);
      return publicMatch;
    }

    if (path === '/client/api/v1/webhooks/paystack' && req.method === 'POST') {
      const webhookRes = await handlePaystackWebhook(req, env);
      applySecurityHeaders(webhookRes.headers);
      writeAnalytics(env, path, req.method, webhookRes.status, Date.now() - start, traceId);
      return webhookRes;
    }

    const auth = await authenticateRequest(req, env);

    const match =
      (await matchBookingRoutes(req, env, auth, path)) ||
      (await matchPropertyRoutes(req, env, auth, path)) ||
      (await matchCompanyRoutes(req, env, auth, path)) ||
      (await matchServiceRoutes(req, env, auth, path));

    if (match) {
      applySecurityHeaders(match.headers);
      writeAnalytics(env, path, req.method, match.status, Date.now() - start, traceId, auth.accountType, auth.role, auth.id);
      return match;
    }

    return jsonErr('NOT_FOUND', `Route not found: ${req.method} ${path}`, 404, undefined, traceId);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 500;
    const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred';
    logger.error('Request failed', { path, method: req.method, status, code, message, traceId });
    writeAnalytics(env, path, req.method, status, Date.now() - start, traceId, undefined, undefined, undefined, 'HTTP_ERROR');
    return jsonErr(code, message, status, err.details, traceId);
  }
}

function writeAnalytics(env: Env, path: string, method: string, status: number, durationMs: number, traceId: string, accountType?: string, role?: string, actorId?: string, result?: 'HTTP_SUCCESS' | 'HTTP_ERROR') {
  writeAnalyticsPoint(env, { path, method, status, durationMs, traceId, accountType, role, actorId, result });
}
