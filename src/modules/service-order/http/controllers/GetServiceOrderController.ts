import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest, notFound } from '../../../../shared/http/HttpError';
import { IServiceOrderService } from '../../application/ServiceOrderService';

export class GetServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.params.id) {
      throw badRequest('ID is required');
    }

    if (!req.user) {
      throw notFound('User not found');
    }

    const created = await this.service.findById(req.params.id, req.user);

    return {
      status: 200,
      body: created
    };
  }
}
