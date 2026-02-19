import { authMiddleware } from './AuthMiddleware';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

describe('AuthMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('should return 401 when no authorization header', () => {
    (req.header as jest.Mock).mockReturnValue('');

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when header does not start with Bearer', () => {
    (req.header as jest.Mock).mockReturnValue('Basic abc123');

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 on invalid token', () => {
    (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should call next and set user on valid token', () => {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ sub: 1, email: 'test@test.com', type: 'admin' }, secret);

    (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      sub: 1,
      email: 'test@test.com',
      type: 'admin',
    });
  });

  it('should return 401 when payload is missing required fields', () => {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ foo: 'bar' }, secret);

    (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should return 401 when sub is not a number', () => {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ sub: 'not-a-number', email: 'test@test.com', type: 'admin' }, secret);

    (req.header as jest.Mock).mockReturnValue(`Bearer ${token}`);

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
