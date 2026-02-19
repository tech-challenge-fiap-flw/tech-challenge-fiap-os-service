import { LoginController } from './LoginController';
import { IUserService } from '../../user/application/UserService';
import { UserEntity } from '../../user/domain/User';
import { HttpRequest } from '../../../shared/http/Controller';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

function makeMockService(): jest.Mocked<IUserService> {
  return {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

function makeUser() {
  return UserEntity.restore({
    id: 1,
    name: 'John',
    email: 'john@test.com',
    password: '$2b$10$hashedpassword',
    type: 'customer',
    active: true,
    creationDate: new Date(),
    cpf: '12345678901',
    phone: '11999',
  });
}

describe('LoginController', () => {
  let controller: LoginController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new LoginController(service);
    jest.clearAllMocks();
  });

  it('should return token on valid login', async () => {
    service.findByEmail.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req: HttpRequest = {
      body: { email: 'john@test.com', password: 'secret123' },
      params: {},
      query: {},
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('token');
  });

  it('should throw unauthorized when user not found', async () => {
    service.findByEmail.mockRejectedValue(new Error('User not found'));

    const req: HttpRequest = {
      body: { email: 'unknown@test.com', password: 'secret123' },
      params: {},
      query: {},
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw unauthorized when password is wrong', async () => {
    service.findByEmail.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req: HttpRequest = {
      body: { email: 'john@test.com', password: 'wrong' },
      params: {},
      query: {},
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw on invalid body', async () => {
    const req: HttpRequest = {
      body: { email: 'not-email' },
      params: {},
      query: {},
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw on missing password', async () => {
    const req: HttpRequest = {
      body: { email: 'john@test.com' },
      params: {},
      query: {},
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
