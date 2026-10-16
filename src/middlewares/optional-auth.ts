import { Env } from '../types/env';
import { AuthContext } from '../types/auth';
import { authenticateRequest } from './authenticate';

export async function optionalAuth(
  req: Request,
  env: Env
): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    return await authenticateRequest(req, env);
  } catch {
    return null;
  }
}
