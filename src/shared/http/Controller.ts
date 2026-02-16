import { Request, Response, NextFunction } from 'express';
import { HttpError } from './HttpError';
import { BadRequestServerException, ForbiddenServerException, NotFoundServerException } from '../application/ServerException';
import { AuthPayload } from '../../modules/auth/AuthMiddleware';
import { logger } from '../../utils/logger';

export interface HttpRequest<TBody = any, TParams = any, TQuery = any> {
  body: TBody;
  params: TParams;
  query: TQuery;
  user?: AuthPayload;
  raw: Request;
}

export interface HttpResponse<T = any> {
  status: number;
  body?: T;
}

export interface IController<TReq = any, TRes = any> {
  handle(request: HttpRequest<TReq>): Promise<HttpResponse<TRes>>;
}

export function adaptExpress(controller: IController) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const httpRequest: HttpRequest = {
        body: req.body,
        params: req.params,
        query: req.query,
        user: (req as any).user,
        raw: req,
      };
      const httpResponse = await controller.handle(httpRequest);
      if (httpResponse.body === undefined) {
        return res.status(httpResponse.status).send();
      }
      return res.status(httpResponse.status).json(httpResponse.body);
    } catch (err: any) {
      logger.error({ service: 'Controller', event: 'unhandled_error', error: err });
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, details: err.details });
      }
      if (err instanceof BadRequestServerException) {
        return res.status(400).json({ error: err.message });
      }
      if (err instanceof NotFoundServerException) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof ForbiddenServerException) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
