import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { IDiagnosisService } from '../../application/DiagnosisService';

export class GetDiagnosisController implements IController {
  constructor(private readonly service: IDiagnosisService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id);

    const diagnosis = await this.service.findById(id);

    return {
      status: 200,
      body: diagnosis
    };
  }
}
