import { GetUserProfileController } from './GetUserProfileController';
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

describe('GetUserProfileController', () => {
  let controller: GetUserProfileController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new GetUserProfileController(service);
  });

  it('should return user profile with 200', async () => {
    service.findById.mockResolvedValue({ id: 1, name: 'John' } as any);

    const req: HttpRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 1, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ id: 1, name: 'John' });
  });

  it('should throw forbidden when no user', async () => {
    const req: HttpRequest = { body: {}, params: {}, query: {}, raw: {} as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw notFound when user not found', async () => {
    service.findById.mockResolvedValue(null as any);

    const req: HttpRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 99, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
