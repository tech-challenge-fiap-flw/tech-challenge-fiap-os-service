import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { forbidden } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';

export class GetUserByIdController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const current = req.user;
    const id = Number(req.params.id);

    if (!current) {
      throw forbidden();
    }

    if (current.type !== 'admin' && current.sub !== id) {
      throw forbidden();
    }

    const user = await this.service.findById(id);

    return {
      status: 200,
      body: user
    };
  }
}
