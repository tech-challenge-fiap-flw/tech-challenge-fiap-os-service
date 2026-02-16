import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { forbidden } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';

export class DeleteCurrentUserController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const current = req.user;

    if (!current) {
      throw forbidden();
    }

    await this.service.deleteUser(current.sub);

    return {
      status: 204
    };
  }
}
