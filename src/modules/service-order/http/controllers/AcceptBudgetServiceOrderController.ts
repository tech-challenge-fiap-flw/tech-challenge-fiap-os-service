import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IServiceOrderService } from '../../application/ServiceOrderService';
import { acceptSchema } from './scremas';

export class AcceptBudgetServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = acceptSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    if (!req.user) {
      throw badRequest('Unauthorized');
    }

    const created = await this.service.decideBudget(req.user, Number(req.params.id), parsed.data);

    return {
      status: 201,
      body: created
    };
  }
}
