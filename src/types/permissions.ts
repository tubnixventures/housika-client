export const COMPANY_PERMISSIONS = [
  'company.dashboard.read',
  'company.staff.read',
  'company.staff.manage',
  'company.privileges.manage',
  'company.properties.manage',
  'company.units.manage',
  'company.bookings.read',
  'company.bookings.approve',
  'company.receipts.manage',
  'company.chats.respond',
  'company.payments.read',
  'company.tenants.lookup',
] as const;

export type CompanyPermission = (typeof COMPANY_PERMISSIONS)[number];

export function isValidCompanyPermission(perm: string): perm is CompanyPermission {
  return (COMPANY_PERMISSIONS as readonly string[]).includes(perm);
}
