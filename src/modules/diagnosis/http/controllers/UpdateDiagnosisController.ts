import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IDiagnosisService } from '../../application/DiagnosisService';
import { updateDiagnosisSchema } from './schemas';

export class UpdateDiagnosisController implements IController {
  constructor(private readonly service: IDiagnosisService) {}
  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id);
    const parsed = updateDiagnosisSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Validation failed', parsed.error.format());
    const updated = await this.service.updateDiagnosis(id, parsed.data as any);
    return { status: 200, body: updated };
  }
}
