import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IDiagnosisService } from '../../application/DiagnosisService';
import { createDiagnosisSchema } from './schemas';

export class CreateDiagnosisController implements IController {
  constructor(private readonly service: IDiagnosisService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = createDiagnosisSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const created = await this.service.create(parsed.data);

    return {
      status: 201,
      body: created
    };
  }
}
