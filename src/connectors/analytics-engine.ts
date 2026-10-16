import { Env } from '../types/env';

export interface AnalyticsPoint {
  path: string;
  method: string;
  status: number;
  durationMs: number;
  country?: string;
  accountType?: string;
  role?: string;
  traceId?: string;
  actorId?: string;
  result?: 'HTTP_SUCCESS' | 'HTTP_ERROR';
}

export function writeAnalyticsPoint(env: Env, point: AnalyticsPoint): void {
  if (env.housika_client_analytics) {
    try {
      env.housika_client_analytics.writeDataPoint({
        blobs: [
          point.path,
          point.method,
          point.country || 'GLOBAL',
          point.accountType || 'anonymous',
          point.role || 'none',
          point.traceId || '',
          point.result || (point.status < 400 ? 'HTTP_SUCCESS' : 'HTTP_ERROR'),
          point.actorId || '',
        ],
        doubles: [point.status, point.durationMs],
      });
    } catch (e) {
      console.warn('Analytics point write failed:', e);
    }
  }
}
