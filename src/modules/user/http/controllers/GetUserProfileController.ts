import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { forbidden, notFound } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';

export class GetUserProfileController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const current = req.user;

    if (!current) {
      throw forbidden();
    }

    const user = await this.service.findById(current.sub);

    if (!user) {
      throw notFound('User not found');
    }

    return {
      status: 200,
      body: user
    };
  }
}
