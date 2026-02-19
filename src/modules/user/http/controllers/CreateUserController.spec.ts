import { CreateUserController } from './CreateUserController';
import { IUserService } from '../../application/UserService';
import { HttpRequest } from '../../../../shared/http/Controller';

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

describe('CreateUserController', () => {
  let controller: CreateUserController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new CreateUserController(service);
  });

  it('should create user and return 201', async () => {
    const body = {
      name: 'John Doe',
      email: 'john@test.com',
      password: 'secret123',
      type: 'customer',
      cpf: '12345678901',
      phone: '11999999999',
    };

    service.createUser.mockResolvedValue({ id: 1, name: 'John Doe', email: 'john@test.com', type: 'customer', active: true, creationDate: new Date(), cpf: '12345678901', phone: '11999999999' } as any);

    const req: HttpRequest = { body, params: {}, query: {}, raw: {} as any };
    const result = await controller.handle(req);

    expect(result.status).toBe(201);
    expect(service.createUser).toHaveBeenCalledWith(body);
  });

  it('should throw on invalid body', async () => {
    const req: HttpRequest = { body: { name: 'J' }, params: {}, query: {}, raw: {} as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw when email is invalid', async () => {
    const req: HttpRequest = {
      body: { name: 'John', email: 'invalid', password: 'secret123', type: 'customer', cpf: '12345678901', phone: '999' },
      params: {}, query: {}, raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
