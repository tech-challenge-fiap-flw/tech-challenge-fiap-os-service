import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { forbidden } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';
import { getPagination, toPage } from '../../../../shared/http/pagination';

export class ListUsersController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const current = req.user;

    if (!current || current.type !== 'admin') {
      throw forbidden();
    }

    const { limit, offset, page } = getPagination(req.raw);

    const [items, total] = await Promise.all([
      this.service.list(offset, limit),
      this.service.countAll(),
    ]);

    return {
      status: 200,
      body: toPage(items, page, limit, total)
    };
  }
}
