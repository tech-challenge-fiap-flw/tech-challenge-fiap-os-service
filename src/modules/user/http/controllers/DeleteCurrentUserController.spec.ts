import { DeleteCurrentUserController } from './DeleteCurrentUserController';
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

describe('DeleteCurrentUserController', () => {
  let controller: DeleteCurrentUserController;
  let service: jest.Mocked<IUserService>;

  beforeEach(() => {
    service = makeMockService();
    controller = new DeleteCurrentUserController(service);
  });

  it('should delete current user and return 204', async () => {
    service.deleteUser.mockResolvedValue();

    const req: HttpRequest = {
      body: {},
      params: {},
      query: {},
      user: { sub: 1, email: 'user@test.com', type: 'customer' },
      raw: {} as any,
    };

    const result = await controller.handle(req);

    expect(result.status).toBe(204);
    expect(service.deleteUser).toHaveBeenCalledWith(1);
  });

  it('should throw forbidden when no user', async () => {
    const req: HttpRequest = { body: {}, params: {}, query: {}, raw: {} as any };

    await expect(controller.handle(req)).rejects.toThrow();
  });
});
