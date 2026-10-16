import { Env } from '../types/env';
import { cleanupDraftResources } from './draft-cleanup';
import { processFileBinPurge } from './file-bin';
import { logger } from '../utils/logger';
import { writeAnalyticsPoint } from '../connectors/analytics-engine';

export async function runJobDailyMidnight(
  env: Env,
  _ctx?: { waitUntil?: (p: Promise<unknown>) => void }
): Promise<void> {
  const start = Date.now();
  logger.info('Starting daily midnight scheduled job');

  try {
    const draftResults = await cleanupDraftResources(env);
    const purgeResults = await processFileBinPurge(env);
    const durationMs = Date.now() - start;

    logger.info('Completed daily midnight scheduled job', {
      propertiesDeleted: draftResults.propertiesDeleted,
      unitsDeleted: draftResults.unitsDeleted,
      filesPurged: purgeResults.purged,
      filesFailed: purgeResults.failed,
      durationMs,
    });

    writeAnalyticsPoint(env, {
      path: 'cron/daily-midnight',
      method: 'CRON',
      status: 200,
      durationMs,
      result: 'HTTP_SUCCESS',
    });
  } catch (err: any) {
    logger.error('Error in daily midnight scheduled job', { error: err.message });
  }
}
