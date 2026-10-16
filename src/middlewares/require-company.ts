import { AuthContext } from '../types/auth';
import { forbidden } from '../helpers/errors';
import { ErrorCodes } from '../types/errors';

export function requireCompany(auth: AuthContext): void {
  if (auth.accountType !== 'company') {
    forbidden(
      ErrorCodes.ACCOUNT_TYPE_FORBIDDEN,
      'This portal is strictly for company accounts'
    );
  }
  if (!auth.companyId) {
    forbidden(
      ErrorCodes.ROLE_FORBIDDEN,
      'Company account is missing companyId'
    );
  }
}
