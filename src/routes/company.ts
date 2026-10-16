import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { handleCompanyDashboard } from '../endpoints/company/dashboard';
import { handleCompanyStaffList } from '../endpoints/company/staff-list';
import { handleCompanyStaffCreate } from '../endpoints/company/staff-create';
import { handleCompanyStaffRoleUpdate } from '../endpoints/company/staff-update';
import { handleCompanyStaffSuspend } from '../endpoints/company/staff-suspend';
import { handleCompanyPrivilegesList } from '../endpoints/company/privileges-list';
import { handleCompanyPrivilegesAssign } from '../endpoints/company/privileges-assign';
import { handleTenantLookup } from '../endpoints/company/tenants-lookup';
import { handleTenantLookupVerify } from '../endpoints/company/tenants-verify';

export async function matchCompanyRoutes(
  req: Request,
  env: Env,
  auth: AuthContext,
  path: string
): Promise<Response | null> {
  const method = req.method;
  if (path === '/client/api/v1/company/dashboard' && method === 'GET') {
    return await handleCompanyDashboard(req, env, auth);
  }
  if (path === '/client/api/v1/company/staff' && method === 'GET') {
    return await handleCompanyStaffList(req, env, auth);
  }
  if (path === '/client/api/v1/company/staff' && method === 'POST') {
    return await handleCompanyStaffCreate(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/company/staff/') && path.endsWith('/role') && method === 'PATCH') {
    const staffId = path.split('/')[5];
    return await handleCompanyStaffRoleUpdate(req, env, auth, staffId);
  }
  if (path.startsWith('/client/api/v1/company/staff/') && path.endsWith('/suspend') && method === 'POST') {
    const staffId = path.split('/')[5];
    return await handleCompanyStaffSuspend(req, env, auth, staffId);
  }
  if (path === '/client/api/v1/company/privileges' && method === 'GET') {
    return await handleCompanyPrivilegesList(req, env, auth);
  }
  if (path.startsWith('/client/api/v1/company/privileges/') && method === 'PUT') {
    const staffId = path.split('/')[5];
    return await handleCompanyPrivilegesAssign(req, env, auth, staffId);
  }
  if (path === '/client/api/v1/company/tenants/lookup' && method === 'POST') {
    return await handleTenantLookup(req, env, auth);
  }
  if (path === '/client/api/v1/company/tenants/lookup/verify' && method === 'POST') {
    return await handleTenantLookupVerify(req, env, auth);
  }
  return null;
}
