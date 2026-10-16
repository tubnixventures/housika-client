import { AuthContext } from '../types/auth';
import { forbidden } from '../helpers/errors';
import { ErrorCodes } from '../types/errors';

export function requireLandlordOrCompany(auth: AuthContext): void {
  if (auth.accountType === 'company') {
    if (!auth.companyId) {
      forbidden(ErrorCodes.ROLE_FORBIDDEN, 'Company account missing companyId');
    }
    return;
  }
  if (auth.accountType === 'individual') {
    if (['landlord', 'dual'].includes(auth.role)) {
      return;
    }
    forbidden(
      ErrorCodes.ROLE_FORBIDDEN,
      'Landlord or dual role is required for this action'
    );
  }
  forbidden(
    ErrorCodes.ACCOUNT_TYPE_FORBIDDEN,
    'Housika accounts cannot perform landlord actions in client backend'
  );
}
