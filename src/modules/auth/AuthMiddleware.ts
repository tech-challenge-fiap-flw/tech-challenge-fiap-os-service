import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthPayload {
  sub: number;
  email: string;
  type: string;
}

const isTokenPayloadValid = (payload: any): boolean => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const hasValidSub = typeof payload.sub === 'number';
  const hasValidEmail = typeof payload.email === 'string';
  const hasValidType = typeof payload.type === 'string';

  return hasValidSub && hasValidEmail && hasValidType;
};

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, secret);

    if (!isTokenPayloadValid(decoded)) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const payload = decoded as JwtPayload;

    (req as any).user = {
      sub: Number(payload.sub),
      email: payload.email as string,
      type: payload.type as string
    } as AuthPayload;

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
}
