import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IServiceOrderService } from '../../application/ServiceOrderService';

export class DeleteServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.params.id) {
      throw badRequest('ID is required');
    }

    await this.service.delete(req.params.id);

    return {
      status: 204
    };
  }
}
