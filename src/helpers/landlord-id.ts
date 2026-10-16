import { AuthContext, JwtClaims } from '../types/auth';
import { forbidden } from './errors';
import { ErrorCodes } from '../types/errors';

export function resolveLandlordId(auth: AuthContext | JwtClaims): string {
  if (auth.accountType === 'company') {
    if (!auth.companyId) {
      forbidden(ErrorCodes.ROLE_FORBIDDEN, 'Company account missing companyId');
    }
    return auth.companyId;
  }
  if (auth.accountType === 'individual') {
    const sub = 'sub' in auth ? auth.sub : auth.id;
    return sub;
  }
  forbidden(ErrorCodes.ACCOUNT_TYPE_FORBIDDEN, 'Invalid account type for landlord operation');
}
