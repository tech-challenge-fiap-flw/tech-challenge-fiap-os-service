import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller'
import { badRequest } from '../../../../shared/http/HttpError'
import { IServiceOrderHistoryService } from '../../application/ServiceOrderHistoryService'
import { listHistorySchema } from './schemas'

export class ListServiceOrderHistoryController implements IController {
  constructor(private readonly service: IServiceOrderHistoryService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const idServiceOrder = Number(req.params.idServiceOrder)

    const parsed = listHistorySchema.safeParse({ idServiceOrder })

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format())
    }

    const items = await this.service.listByServiceOrder(parsed.data.idServiceOrder)

    return {
      status: 200,
      body: items
    }
  }
}
