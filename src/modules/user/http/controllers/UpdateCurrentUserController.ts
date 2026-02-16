import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest, forbidden } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';
import { updateUserSchema } from './schemas';

export class UpdateCurrentUserController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const current = req.user;

    if (!current) {
      throw forbidden();
    }

    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const result = await this.service.updateUser(current.sub, parsed.data);

    return {
      status: 200,
      body: result
    };
  }
}
