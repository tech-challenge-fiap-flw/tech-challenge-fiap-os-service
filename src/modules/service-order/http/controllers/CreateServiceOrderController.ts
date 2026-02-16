import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IServiceOrderService } from '../../application/ServiceOrderService';
import { createSchema } from './scremas';

export class CreateServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    if (!req.user) {
      throw badRequest('Unauthorized');
    }

    const created = await this.service.create(req.user, parsed.data);

    return {
      status: 201,
      body: created
    };
  }
}
