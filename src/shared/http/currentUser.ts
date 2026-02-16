import { HttpRequest } from './Controller';
import { unauthorized } from './HttpError';
import { AuthPayload } from '../../modules/auth/AuthMiddleware';

function isAuthPayload(u: any): u is AuthPayload {
  return !!u && typeof u.sub === 'number' && typeof u.email === 'string' && typeof u.type === 'string';
}

export function getCurrentUser(req: Pick<HttpRequest, 'user'> | { user?: any }): AuthPayload | undefined {
  if (isAuthPayload(req.user)) return req.user;
  return undefined;
}

export function getCurrentUserId(req: Pick<HttpRequest, 'user'> | { user?: any }): number | undefined {
  return getCurrentUser(req)?.sub;
}

export function requireCurrentUserId(req: Pick<HttpRequest, 'user'> | { user?: any }): number {
  const id = getCurrentUserId(req);
  if (typeof id !== 'number') throw unauthorized('Unauthorized');
  return id;
}
