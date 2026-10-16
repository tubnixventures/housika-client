import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { handlePropertyCreate } from '../endpoints/properties/create';
import { handlePropertyList } from '../endpoints/properties/list';
import { handlePropertyGetOrUpdate } from '../endpoints/properties/detail';
import { handleUnitCreate } from '../endpoints/units/create';
import { handleUnitList } from '../endpoints/units/list';
import { handleUnitGetOrPatch } from '../endpoints/units/detail';
import { handleUnitStatusPatch } from '../endpoints/units/status';

export async function matchPropertyRoutes(
  req: Request,
  env: Env,
  auth: AuthContext,
  path: string
): Promise<Response | null> {
  const method = req.method;
  if (path === '/client/api/v1/properties' && method === 'POST') {
    return await handlePropertyCreate(req, env, auth);
  }
  if (path === '/client/api/v1/properties' && method === 'GET') {
    return await handlePropertyList(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/properties/') && (method === 'GET' || method === 'PATCH')) {
    const propId = path.split('/')[5];
    return await handlePropertyGetOrUpdate(req, env, auth, propId);
  }
  if (path === '/client/api/v1/units' && method === 'POST') {
    return await handleUnitCreate(req, env, auth);
  }
  if (path === '/client/api/v1/units' && method === 'GET') {
    return await handleUnitList(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/units/') && path.endsWith('/status') && method === 'PATCH') {
    const unitId = path.split('/')[5];
    return await handleUnitStatusPatch(req, env, auth, unitId);
  }
  if (path.startsWith('/client/api/v1/units/') && (method === 'GET' || method === 'PATCH')) {
    const unitId = path.split('/')[5];
    return await handleUnitGetOrPatch(req, env, auth, unitId);
  }
  return null;
}
