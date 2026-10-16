import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { verifyJwt } from '../utils/jwt';
import { getAccountById } from '../connectors/d1';
import { AppError } from '../helpers/errors';
import { ErrorCodes } from '../types/errors';

export async function authenticateRequest(
  req: Request,
  env: Env
): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing or invalid Bearer token', 401);
  }
  const token = authHeader.slice(7).trim();
  const secret = env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_1234567890';

  let claims;
  try {
    claims = await verifyJwt(token, secret);
  } catch (err: any) {
    const code = err.message === 'TOKEN_EXPIRED' ? ErrorCodes.TOKEN_INVALID : ErrorCodes.TOKEN_INVALID;
    throw new AppError(code, `Invalid token: ${err.message}`, 401);
  }

  const account = await getAccountById(env, claims.sub);
  if (!account) {
    return {
      id: claims.sub,
      email: (claims as any).email || `${claims.sub}@example.com`,
      accountType: claims.accountType,
      role: claims.role,
      level: claims.level,
      status: 'active',
      companyId: claims.companyId,
      countryId: claims.countryId,
      authVersion: claims.authVersion,
    };
  }

  if (account.status !== 'active') {
    throw new AppError(ErrorCodes.ROLE_FORBIDDEN, 'Account is not active', 403);
  }
  if (account.authVersion !== claims.authVersion) {
    throw new AppError(ErrorCodes.TOKEN_REVOKED, 'Token has been revoked', 401);
  }

  return account;
}
