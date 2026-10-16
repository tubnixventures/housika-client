import { Env } from '../types/env';
import { AuthContext } from '../types/auth';

export async function getAccountById(env: Env, accountId: string): Promise<AuthContext | null> {
  if (!env.DB_ACCOUNTS) return null;
  const res = await env.DB_ACCOUNTS.prepare(
    'SELECT id, email, phone_number, account_type, role, level, status, company_id, country_id, auth_version FROM accounts WHERE id = ?'
  ).bind(accountId).first<any>();
  if (!res) return null;
  return {
    id: res.id,
    email: res.email,
    phoneNumber: res.phone_number,
    accountType: res.account_type,
    role: res.role,
    level: Number(res.level),
    status: res.status,
    companyId: res.company_id,
    countryId: res.country_id,
    authVersion: Number(res.auth_version),
  };
}

export async function getCountryById(env: Env, countryId: string): Promise<any | null> {
  if (!env.DB_COUNTRIES) return null;
  return await env.DB_COUNTRIES.prepare(
    'SELECT id, name, iso2, iso3, calling_code, currency_code, currency_name, listing_fee, booking_fee, payment_gateway, is_active FROM countries WHERE id = ?'
  ).bind(countryId).first<any>();
}

export async function getCompanyPermissions(env: Env, companyId: string, accountId: string): Promise<string[]> {
  if (!env.DB_COMPANY_PERMISSIONS) return [];
  const res = await env.DB_COMPANY_PERMISSIONS.prepare(
    'SELECT permission FROM company_permissions WHERE company_id = ? AND account_id = ?'
  ).bind(companyId, accountId).all<{ permission: string }>();
  return res.results?.map(r => r.permission) ?? [];
}
