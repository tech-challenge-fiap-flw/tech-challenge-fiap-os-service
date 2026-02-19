import { CreateServiceOrderController } from './CreateServiceOrderController';
import { AcceptServiceOrderController } from './AcceptServiceOrderController';
import { AcceptBudgetServiceOrderController } from './AcceptBudgetServiceOrderController';
import { StartRepairServiceOrderController } from './StartRepairServiceOrderController';
import { FinishRepairServiceOrderController } from './FinishRepairServiceOrderController';
import { DeliveredServiceOrderController } from './DeliveredServiceOrderController';
import { DeleteServiceOrderController } from './DeleteServiceOrderController';
import { GetServiceOrderController } from './GetServiceOrderController';
import { ExecutionTimeServiceOrderController } from './ExecutionTimeServiceOrderController';
import { AverageExecutionTimeServiceOrderController } from './AverageExecutionTimeServiceOrderController';
import { IServiceOrderService } from '../../application/ServiceOrderService';
import { HttpRequest } from '../../../../shared/http/Controller';

function makeMockService(): jest.Mocked<IServiceOrderService> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
    accept: jest.fn(),
    startRepair: jest.fn(),
    finishRepair: jest.fn(),
    delivered: jest.fn(),
    update: jest.fn(),
    decideBudget: jest.fn(),
    getExecutionTimeById: jest.fn(),
    getAverageExecutionTime: jest.fn(),
  };
}

const adminUser = { sub: 1, email: 'admin@test.com', type: 'admin' };
const customerUser = { sub: 10, email: 'cust@test.com', type: 'customer' };

describe('ServiceOrder Controllers', () => {
  let service: jest.Mocked<IServiceOrderService>;

  beforeEach(() => {
    service = makeMockService();
  });

  describe('CreateServiceOrderController', () => {
    it('should create service order and return 201', async () => {
      const controller = new CreateServiceOrderController(service);
      service.create.mockResolvedValue({ id: 1, description: 'Test' } as any);

      const req: HttpRequest = {
        body: { description: 'Troca de óleo', vehicleId: 1 },
        params: {},
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.create).toHaveBeenCalledWith(customerUser, expect.objectContaining({ description: 'Troca de óleo' }));
    });

    it('should throw on invalid body', async () => {
      const controller = new CreateServiceOrderController(service);
      const req: HttpRequest = { body: { description: '' }, params: {}, query: {}, user: customerUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new CreateServiceOrderController(service);
      const req: HttpRequest = {
        body: { description: 'Test', vehicleId: 1 },
        params: {},
        query: {},
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('AcceptServiceOrderController', () => {
    it('should accept and return 201', async () => {
      const controller = new AcceptServiceOrderController(service);
      service.accept.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: { accept: true },
        params: { id: '1' },
        query: {},
        user: adminUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.accept).toHaveBeenCalledWith(adminUser, 1, { accept: true });
    });

    it('should throw on invalid body', async () => {
      const controller = new AcceptServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, user: adminUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new AcceptServiceOrderController(service);
      const req: HttpRequest = { body: { accept: true }, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('AcceptBudgetServiceOrderController', () => {
    it('should decide budget and return 201', async () => {
      const controller = new AcceptBudgetServiceOrderController(service);
      service.decideBudget.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: { accept: true },
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.decideBudget).toHaveBeenCalledWith(customerUser, 1, { accept: true });
    });

    it('should throw on invalid body', async () => {
      const controller = new AcceptBudgetServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, user: customerUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new AcceptBudgetServiceOrderController(service);
      const req: HttpRequest = { body: { accept: false }, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('StartRepairServiceOrderController', () => {
    it('should start repair and return 200', async () => {
      const controller = new StartRepairServiceOrderController(service);
      service.startRepair.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: adminUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no id', async () => {
      const controller = new StartRepairServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, user: adminUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new StartRepairServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('FinishRepairServiceOrderController', () => {
    it('should finish repair and return 200', async () => {
      const controller = new FinishRepairServiceOrderController(service);
      service.finishRepair.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: adminUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no id', async () => {
      const controller = new FinishRepairServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, user: adminUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new FinishRepairServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('DeliveredServiceOrderController', () => {
    it('should mark delivered and return 200', async () => {
      const controller = new DeliveredServiceOrderController(service);
      service.delivered.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: adminUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no id', async () => {
      const controller = new DeliveredServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, user: adminUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new DeliveredServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('DeleteServiceOrderController', () => {
    it('should delete and return 204', async () => {
      const controller = new DeleteServiceOrderController(service);
      service.delete.mockResolvedValue();

      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      const result = await controller.handle(req);

      expect(result.status).toBe(204);
    });

    it('should throw when no id', async () => {
      const controller = new DeleteServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('GetServiceOrderController', () => {
    it('should return service order with 200', async () => {
      const controller = new GetServiceOrderController(service);
      service.findById.mockResolvedValue({ id: 1, description: 'Test' } as any);

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no id', async () => {
      const controller = new GetServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, user: customerUser, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when no user', async () => {
      const controller = new GetServiceOrderController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('ExecutionTimeServiceOrderController', () => {
    it('should return execution time with 200', async () => {
      const controller = new ExecutionTimeServiceOrderController(service);
      service.getExecutionTimeById.mockResolvedValue({ executionTimeMs: 3600000 });

      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ executionTimeMs: 3600000 });
    });
  });

  describe('AverageExecutionTimeServiceOrderController', () => {
    it('should return average execution time with 200', async () => {
      const controller = new AverageExecutionTimeServiceOrderController(service);
      service.getAverageExecutionTime.mockResolvedValue({ averageExecutionTimeMs: 5400000 });

      const req: HttpRequest = { body: {}, params: {}, query: {}, raw: {} as any };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ averageExecutionTimeMs: 5400000 });
    });
  });
});
