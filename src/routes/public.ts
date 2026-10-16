import { Env } from '../types/env';
import { handleHealth } from '../endpoints/health/index';
import { handleDoc } from '../endpoints/doc/index';
import { handlePublicHome } from '../endpoints/public/home/index';
import { handlePublicSearch } from '../endpoints/public/search/index';
import { handlePublicCategory } from '../endpoints/public/category/index';
import { handlePublicUnitsList } from '../endpoints/public/units/list';
import { handlePublicUnitDetail } from '../endpoints/public/units/detail';
import { handlePublicPropertyDetail } from '../endpoints/public/properties/detail';
import { handleReceiptVerify } from '../endpoints/public/receipts/verify';

export async function matchPublicRoutes(req: Request, env: Env, path: string): Promise<Response | null> {
  const method = req.method;
  if (path === '/' || path === '/doc') return await handleDoc();
  if (path === '/health') return await handleHealth(req, env);
  if (path === '/client/api/v1/public/home' && method === 'GET') return await handlePublicHome(req, env);
  if (path === '/client/api/v1/public/search' && method === 'GET') return await handlePublicSearch(req, env);
  if (path.startsWith('/client/api/v1/public/category/') && method === 'GET') {
    const category = path.split('/')[6];
    return await handlePublicCategory(req, env, category);
  }
  if (path === '/client/api/v1/public/units' && method === 'GET') return await handlePublicUnitsList(req, env);
  if (path.startsWith('/client/api/v1/public/units/') && method === 'GET') {
    const unitId = path.split('/')[6];
    return await handlePublicUnitDetail(req, env, unitId);
  }
  if (path.startsWith('/client/api/v1/public/properties/') && method === 'GET') {
    const propId = path.split('/')[6];
    return await handlePublicPropertyDetail(req, env, propId);
  }
  if (path.startsWith('/client/api/v1/public/receipts/verify') && method === 'GET') {
    return await handleReceiptVerify(req, env);
  }
  return null;
}
