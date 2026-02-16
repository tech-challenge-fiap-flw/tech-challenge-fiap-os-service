import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { type?: string } | undefined;

    if (!user || !user.type || !roles.includes(user.type)) {
      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    next();
  };
}
