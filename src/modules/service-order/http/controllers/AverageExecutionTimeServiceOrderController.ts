import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { IServiceOrderService } from '../../application/ServiceOrderService';

export class AverageExecutionTimeServiceOrderController implements IController {
  constructor(
    private readonly service: IServiceOrderService
  ) {}

  async handle(_req: HttpRequest): Promise<HttpResponse> {
    const result = await this.service.getAverageExecutionTime();

    return {
      status: 200,
      body: result
    };
  }
}
