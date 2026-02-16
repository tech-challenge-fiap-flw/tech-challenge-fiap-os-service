import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller'
import { IDiagnosisService } from '../../application/DiagnosisService'

export class DeleteDiagnosisController implements IController {
  constructor(private readonly service: IDiagnosisService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id)

    await this.service.deleteDiagnosis(id)

    return {
      status: 204
    }
  }
}
