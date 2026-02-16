import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { IDiagnosisService } from '../../application/DiagnosisService';
import { getPagination, toPage } from '../../../../shared/http/pagination';

export class ListDiagnosesController implements IController {
  constructor(private readonly service: IDiagnosisService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const { page, limit, offset } = getPagination(req.raw as any);

    const [items, total] = await Promise.all([
      this.service.list(offset, limit),
      this.service.countAll()
    ]);

    return {
      status: 200,
      body: toPage(items, page, limit, total)
    };
  }
}
