import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IServiceOrderHistoryService } from '../../application/ServiceOrderHistoryService';
import { logHistorySchema } from './schemas';

export class LogServiceOrderHistoryController implements IController {
  constructor(
    private readonly service: IServiceOrderHistoryService
  ) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = logHistorySchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const created = await this.service.logStatusChange(parsed.data);

    return {
      status: 201,
      body: created
    };
  }
}
