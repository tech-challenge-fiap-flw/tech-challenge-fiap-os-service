import { requireRole } from './RoleMiddleware';
import { Request, Response, NextFunction } from 'express';

describe('RoleMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should call next when user has required role', () => {
    (req as any).user = { type: 'admin' };

    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next when user has one of multiple required roles', () => {
    (req as any).user = { type: 'mechanic' };

    const middleware = requireRole('admin', 'mechanic');
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when user does not have required role', () => {
    (req as any).user = { type: 'customer' };

    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when no user on request', () => {
    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 403 when user has no type', () => {
    (req as any).user = {};

    const middleware = requireRole('admin');
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
