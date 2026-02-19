import { LogServiceOrderHistoryController } from './LogServiceOrderHistoryController';
import { ListServiceOrderHistoryController } from './ListServiceOrderHistoryController';
import { IServiceOrderHistoryService } from '../../application/ServiceOrderHistoryService';
import { HttpRequest } from '../../../../shared/http/Controller';

function makeMockService(): jest.Mocked<IServiceOrderHistoryService> {
  return {
    logStatusChange: jest.fn(),
    listByServiceOrder: jest.fn(),
  };
}

describe('ServiceOrderHistory Controllers', () => {
  let service: jest.Mocked<IServiceOrderHistoryService>;

  beforeEach(() => {
    service = makeMockService();
  });

  describe('LogServiceOrderHistoryController', () => {
    it('should log history and return 201', async () => {
      const controller = new LogServiceOrderHistoryController(service);
      service.logStatusChange.mockResolvedValue({ id: '1', idServiceOrder: 1, userId: 5, newStatus: 'Recebida', changedAt: new Date() } as any);

      const req: HttpRequest = {
        body: { idServiceOrder: 1, userId: 5, newStatus: 'Recebida' },
        params: {},
        query: {},
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.logStatusChange).toHaveBeenCalled();
    });

    it('should throw on invalid body', async () => {
      const controller = new LogServiceOrderHistoryController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when newStatus is empty', async () => {
      const controller = new LogServiceOrderHistoryController(service);
      const req: HttpRequest = {
        body: { idServiceOrder: 1, userId: 5, newStatus: '' },
        params: {},
        query: {},
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('ListServiceOrderHistoryController', () => {
    it('should list history and return 200', async () => {
      const controller = new ListServiceOrderHistoryController(service);
      service.listByServiceOrder.mockResolvedValue([{ id: '1', idServiceOrder: 1 } as any]);

      const req: HttpRequest = {
        body: {},
        params: { idServiceOrder: '1' },
        query: {},
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(service.listByServiceOrder).toHaveBeenCalledWith(1);
    });

    it('should throw on invalid idServiceOrder', async () => {
      const controller = new ListServiceOrderHistoryController(service);
      const req: HttpRequest = {
        body: {},
        params: { idServiceOrder: 'abc' },
        query: {},
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw on negative idServiceOrder', async () => {
      const controller = new ListServiceOrderHistoryController(service);
      const req: HttpRequest = {
        body: {},
        params: { idServiceOrder: '-1' },
        query: {},
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });
});
