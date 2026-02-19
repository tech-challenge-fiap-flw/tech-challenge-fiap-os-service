import { ListUsersController } from './ListUsersController';
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

describe('ListUsersController', () => {
  let controller: ListUsersController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new ListUsersController(service);
  });

  it('should list users for admin with pagination', async () => {
    service.list.mockResolvedValue([{ id: 1, name: 'User1' } as any]);
    service.countAll.mockResolvedValue(1);

    const req: HttpRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 1, email: 'admin@test.com', type: 'admin' },
      raw: { query: { page: '1', limit: '10' } } as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('items');
    expect(result.body).toHaveProperty('total');
    expect(result.body).toHaveProperty('totalPages');
  });

  it('should throw forbidden when no user', async () => {
    const req: HttpRequest = { body: {}, params: {}, query: {}, raw: { query: {} } as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw forbidden when non-admin', async () => {
    const req: HttpRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 1, email: 'user@test.com', type: 'customer' },
      raw: { query: {} } as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
