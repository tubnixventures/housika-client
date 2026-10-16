import { AuthContext } from '../types/auth';
import { forbidden } from '../helpers/errors';
import { ErrorCodes } from '../types/errors';

export function requireIndividual(auth: AuthContext): void {
  if (auth.accountType !== 'individual') {
    forbidden(
      ErrorCodes.ACCOUNT_TYPE_FORBIDDEN,
      'This action is only allowed for individual accounts'
    );
  }
}
