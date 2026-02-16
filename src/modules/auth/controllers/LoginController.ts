import { IController, HttpRequest, HttpResponse } from '../../../shared/http/Controller';
import { badRequest, unauthorized } from '../../../shared/http/HttpError';
import { loginSchema } from './schemas';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { IUserService } from '../../user/application/UserService';

export class LoginController implements IController {
  constructor(private readonly service: IUserService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const { email, password } = parsed.data;
    const user = await this.service.findByEmail(email);

    if (!user) {
      throw unauthorized('Invalid credentials');
    }

    const data = user.toJSON();
    const isValidPassword = await bcrypt.compare(password, data.password);

    if (!isValidPassword) {
      throw unauthorized('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { sub: data.id, email: data.email, type: data.type },
      secret,
      { expiresIn: '1h' }
    );

    return {
      status: 200,
      body: { token }
    };
  }
}
