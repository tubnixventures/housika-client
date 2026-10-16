export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  nextCursor?: string;
}

export function jsonOk<T>(
  data: T,
  message = 'Success',
  status = 200,
  meta?: PaginationMeta,
  headersInit?: HeadersInit
): Response {
  const headers = new Headers(headersInit);
  headers.set('Content-Type', 'application/json');
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    }),
    { status, headers }
  );
}

export function jsonErr(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  traceId = 'trace_local',
  headersInit?: HeadersInit
): Response {
  const headers = new Headers(headersInit);
  headers.set('Content-Type', 'application/json');
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: { code, ...(details !== undefined ? { details } : {}) },
      traceId,
    }),
    { status, headers }
  );
}
