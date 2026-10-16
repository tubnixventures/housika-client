import { Env } from '../types/env';
import { AppError } from '../helpers/errors';
import { ErrorCodes } from '../types/errors';

const memLimits = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  env: Env,
  key: string,
  maxCount: number,
  windowSec: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  if (env.KV_RATE_LIMIT) {
    const val = await env.KV_RATE_LIMIT.get(key, { type: 'json' });
    if (val && val.resetAt > now) {
      if (val.count >= maxCount) {
        throw new AppError(ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Try again later.', 429);
      }
      await env.KV_RATE_LIMIT.put(key, JSON.stringify({ count: val.count + 1, resetAt: val.resetAt }), {
        expirationTtl: Math.max(val.resetAt - now, 60),
      });
      return;
    }
    await env.KV_RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + windowSec }), {
      expirationTtl: windowSec,
    });
    return;
  }

  const existing = memLimits.get(key);
  if (existing && existing.resetAt > now) {
    if (existing.count >= maxCount) {
      throw new AppError(ErrorCodes.RATE_LIMITED, 'Rate limit exceeded. Try again later.', 429);
    }
    existing.count += 1;
    return;
  }
  memLimits.set(key, { count: 1, resetAt: now + windowSec });
}
