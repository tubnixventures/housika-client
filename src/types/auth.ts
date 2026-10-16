export type AccountType = 'housika' | 'company' | 'individual';

export const COMPANY_ROLE_LEVELS: Record<string, number> = {
  root: 70,
  ceo: 65,
  admin: 60,
  manager: 55,
  customercare: 50,
};

export const INDIVIDUAL_ROLE_LEVELS: Record<string, number> = {
  landlord: 30,
  dual: 25,
  tenant: 20,
};

export interface JwtClaims {
  sub: string;
  sid?: string;
  countryId: string;
  accountType: AccountType;
  role: string;
  level: number;
  companyId?: string | null;
  scopeId?: string | null;
  authVersion: number;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface AuthContext {
  id: string;
  email: string;
  phoneNumber?: string | null;
  accountType: AccountType;
  role: string;
  level: number;
  status: 'active' | 'pending_verification' | 'suspended' | 'deactivated';
  companyId?: string | null;
  countryId: string;
  authVersion: number;
  name?: string;
  displayName?: string;
}
