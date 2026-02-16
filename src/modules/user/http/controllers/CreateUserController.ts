import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IUserService } from '../../application/UserService';
import { createUserSchema } from './schemas';

export class CreateUserController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const result = await this.service.createUser(parsed.data);

    return {
      status: 201,
      body: result
    };
  }
}
