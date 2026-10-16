export async function getCachedResponse(req: Request): Promise<Response | null> {
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const match = await caches.default.match(req);
      if (match) return match;
    }
  } catch {}
  return null;
}

export async function putCachedResponse(
  req: Request,
  res: Response,
  ttlSeconds: number,
  ctx?: { waitUntil: (p: Promise<unknown>) => void }
): Promise<Response> {
  const cloned = res.clone();
  const headers = new Headers(cloned.headers);
  headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);
  headers.set('X-Housika-Cache', 'HIT');
  const cacheable = new Response(cloned.body, { status: cloned.status, headers });

  if (typeof caches !== 'undefined' && caches.default) {
    const putPromise = caches.default.put(req, cacheable.clone());
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(putPromise);
    } else {
      await putPromise.catch(() => {});
    }
  }
  return res;
}
