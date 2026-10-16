export function applySecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none';"
  );
}

export function getOrCreateTraceId(req: Request): string {
  return (
    req.headers.get('x-trace-id') ||
    req.headers.get('cf-ray') ||
    `trace_${Math.random().toString(36).slice(2, 11)}`
  );
}
