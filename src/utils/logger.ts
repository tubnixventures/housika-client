export interface LogContext {
  traceId?: string;
  accountId?: string;
  path?: string;
  method?: string;
  status?: number;
  [key: string]: unknown;
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };
  const sensitiveKeys = ['authorization', 'token', 'password', 'otp', 'secret', 'key'];
  for (const k of Object.keys(redacted)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      redacted[k] = '[REDACTED]';
    }
  }
  return redacted;
}

export const logger = {
  info(message: string, ctx: LogContext = {}) {
    console.log(JSON.stringify({ level: 'INFO', time: new Date().toISOString(), message, ...sanitize(ctx) }));
  },
  warn(message: string, ctx: LogContext = {}) {
    console.warn(JSON.stringify({ level: 'WARN', time: new Date().toISOString(), message, ...sanitize(ctx) }));
  },
  error(message: string, ctx: LogContext = {}) {
    console.error(JSON.stringify({ level: 'ERROR', time: new Date().toISOString(), message, ...sanitize(ctx) }));
  },
};
