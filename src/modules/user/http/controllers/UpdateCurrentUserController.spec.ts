import { UpdateCurrentUserController } from './UpdateCurrentUserController';
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

describe('UpdateCurrentUserController', () => {
  let controller: UpdateCurrentUserController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new UpdateCurrentUserController(service);
  });

  it('should update current user and return 200', async () => {
    service.updateUser.mockResolvedValue({ id: 1, name: 'Updated' } as any);

    const req: HttpRequest = {
      body: { name: 'Updated' },
      params: {},
      query: {},
      user: { sub: 1, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(200);
    expect(service.updateUser).toHaveBeenCalledWith(1, { name: 'Updated' });
  });

  it('should throw forbidden when no user', async () => {
    const req: HttpRequest = { body: { name: 'Test' }, params: {}, query: {}, raw: {} as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });

  it('should throw on invalid body', async () => {
    const req: HttpRequest = {
      body: { email: 'not-an-email' },
      params: {},
      query: {},
      user: { sub: 1, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
