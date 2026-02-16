import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IServiceOrderService } from '../../application/ServiceOrderService';

export class FinishRepairServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    if (!req.params.id) {
      throw badRequest('Missing service order ID');
    }

    if (!req.user) {
      throw badRequest('Unauthorized');
    }

    const updated = await this.service.finishRepair(req.user, Number(req.params.id));

    return {
      status: 200,
      body: updated
    };
  }
}
