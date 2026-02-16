import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller'
import { IServiceOrderService } from '../../application/ServiceOrderService'

export class ExecutionTimeServiceOrderController implements IController {
  constructor(private readonly service: IServiceOrderService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id)

    const result = await this.service.getExecutionTimeById(id)

    return {
      status: 200,
      body: result
    }
  }
}
