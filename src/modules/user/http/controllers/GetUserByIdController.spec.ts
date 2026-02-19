import { GetUserByIdController } from './GetUserByIdController';
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

describe('GetUserByIdController', () => {
  let controller: GetUserByIdController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new GetUserByIdController(service);
  });

  it('should return user for admin', async () => {
    service.findById.mockResolvedValue({ id: 5, name: 'Target' } as any);

    const req: HttpRequest = {
      body: {},
      params: { id: '5' },
      query: {},
      user: { sub: 1, email: 'admin@test.com', type: 'admin' },
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
    expect(service.findById).toHaveBeenCalledWith(5);
  });

  it('should return user when requesting own profile', async () => {
    service.findById.mockResolvedValue({ id: 5, name: 'Self' } as any);

    const req: HttpRequest = {
      body: {},
      params: { id: '5' },
      query: {},
      user: { sub: 5, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
  });

  it('should throw forbidden when customer tries to view another user', async () => {
    const req: HttpRequest = {
      body: {},
      params: { id: '10' },
      query: {},
      user: { sub: 5, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw forbidden when no user', async () => {
    const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
