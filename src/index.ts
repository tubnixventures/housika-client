import { Env } from './types/env';
import { handleRequest } from './routes';
import { runJobHalfHourly } from './jobs/half-hourly';
import { runJobDailyMidnight } from './jobs/daily-midnight';

export interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Env, _ctx?: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx?: ExecutionContext): Promise<void> {
    if (event.cron === '0 0 * * *') {
      await runJobDailyMidnight(env, ctx);
    } else {
      await runJobHalfHourly(env, ctx);
    }
  },
};
