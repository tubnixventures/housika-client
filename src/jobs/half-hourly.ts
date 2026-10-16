import { Env } from '../types/env';
import { cleanupStaleUnpaidBookings } from './stale-payment-cleanup';
import { sendLandlordApprovalReminders } from './booking-reminders';
import { logger } from '../utils/logger';
import { writeAnalyticsPoint } from '../connectors/analytics-engine';

export async function runJobHalfHourly(
  env: Env,
  _ctx?: { waitUntil?: (p: Promise<unknown>) => void }
): Promise<void> {
  const start = Date.now();
  logger.info('Starting half-hourly scheduled job');

  try {
    const staleCount = await cleanupStaleUnpaidBookings(env);
    const remindedCount = await sendLandlordApprovalReminders(env);
    const durationMs = Date.now() - start;

    logger.info('Completed half-hourly scheduled job', {
      staleCleaned: staleCount,
      remindersSent: remindedCount,
      durationMs,
    });

    writeAnalyticsPoint(env, {
      path: 'cron/half-hourly',
      method: 'CRON',
      status: 200,
      durationMs,
      result: 'HTTP_SUCCESS',
    });
  } catch (err: any) {
    logger.error('Error in half-hourly scheduled job', { error: err.message });
  }
}
