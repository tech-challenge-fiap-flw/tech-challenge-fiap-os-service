import { ServiceOrderService } from './ServiceOrderService';
import { IServiceOrderRepository } from '../domain/IServiceOrderRepository';
import { IDiagnosisService } from '../../diagnosis/application/DiagnosisService';
import { IServiceOrderHistoryService } from '../../service-order-history/application/ServiceOrderHistoryService';
import { ServiceOrderEntity } from '../domain/ServiceOrder';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';
import { AuthPayload } from '../../auth/AuthMiddleware';
import { BadRequestServerException, ForbiddenServerException, NotFoundServerException } from '../../../shared/application/ServerException';
import { SqsPublisher } from '../../../infra/messaging/SqsPublisher';

function makeOrder(overrides: Record<string, any> = {}) {
  return ServiceOrderEntity.restore({
    id: 1,
    description: 'Troca de óleo',
    creationDate: new Date('2024-01-01'),
    currentStatus: ServiceOrderStatus.RECEBIDA,
    budgetId: null,
    customerId: 10,
    mechanicId: null,
    vehicleId: 5,
    active: true,
    ...overrides,
  });
}

function makeMockRepo(): jest.Mocked<IServiceOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findActiveByBudgetId: jest.fn(),
    listFinishedOrDelivered: jest.fn(),
    transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
  };
}

function makeMockDiagnosisService(): jest.Mocked<IDiagnosisService> {
  return {
    create: jest.fn(),
    updateDiagnosis: jest.fn(),
    deleteDiagnosis: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

function makeMockHistoryService(): jest.Mocked<IServiceOrderHistoryService> {
  return {
    logStatusChange: jest.fn().mockResolvedValue({
      id: 'hist1',
      idServiceOrder: 1,
      userId: 10,
      oldStatus: null,
      newStatus: ServiceOrderStatus.RECEBIDA,
      changedAt: new Date(),
    }),
    listByServiceOrder: jest.fn(),
  };
}

function makeMockSqsPublisher(): jest.Mocked<SqsPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as any;
}

const adminUser: AuthPayload = { sub: 1, email: 'admin@test.com', type: 'admin' };
const mechanicUser: AuthPayload = { sub: 2, email: 'mech@test.com', type: 'mechanic' };
const customerUser: AuthPayload = { sub: 10, email: 'cust@test.com', type: 'customer' };

describe('ServiceOrderService', () => {
  let service: ServiceOrderService;
  let repo: jest.Mocked<IServiceOrderRepository>;
  let diagService: jest.Mocked<IDiagnosisService>;
  let histService: jest.Mocked<IServiceOrderHistoryService>;
  let sqsPublisher: jest.Mocked<SqsPublisher>;

  beforeEach(() => {
    repo = makeMockRepo();
    diagService = makeMockDiagnosisService();
    histService = makeMockHistoryService();
    sqsPublisher = makeMockSqsPublisher();
    service = new ServiceOrderService(repo, diagService, histService, sqsPublisher);
  });

  describe('create', () => {
    it('should create a service order', async () => {
      repo.create.mockResolvedValue(makeOrder());

      const result = await service.create(customerUser, {
        description: 'Troca de óleo',
        vehicleId: 5,
      });

      expect(repo.create).toHaveBeenCalled();
      expect(histService.logStatusChange).toHaveBeenCalled();
      expect(sqsPublisher.publish).toHaveBeenCalled();
      expect(result.description).toBe('Troca de óleo');
    });

    it('should create without sqsPublisher', async () => {
      const serviceNoSqs = new ServiceOrderService(repo, diagService, histService);
      repo.create.mockResolvedValue(makeOrder());

      const result = await serviceNoSqs.create(customerUser, {
        description: 'Test',
        vehicleId: 5,
      });

      expect(result.description).toBe('Troca de óleo');
    });
  });

  describe('findById', () => {
    it('should return service order for admin', async () => {
      repo.findById.mockResolvedValue(makeOrder());

      const result = await service.findById(1, adminUser);

      expect(repo.findById).toHaveBeenCalledWith(1, undefined);
      expect(result.id).toBe(1);
    });

    it('should filter by userId for non-admin', async () => {
      repo.findById.mockResolvedValue(makeOrder());

      await service.findById(1, customerUser);

      expect(repo.findById).toHaveBeenCalledWith(1, 10);
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('update', () => {
    it('should update service order', async () => {
      repo.update.mockResolvedValue(makeOrder({ description: 'Updated' }));

      const result = await service.update(1, { description: 'Updated' });

      expect(result?.description).toBe('Updated');
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.update.mockResolvedValue(null);

      await expect(service.update(99, { description: 'X' })).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('delete', () => {
    it('should delete service order', async () => {
      repo.findById.mockResolvedValue(makeOrder());
      repo.softDelete.mockResolvedValue();

      await service.delete(1);

      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('accept', () => {
    it('should accept an order and change status to EM_DIAGNOSTICO', async () => {
      repo.findById
        .mockResolvedValueOnce(makeOrder())
        .mockResolvedValueOnce(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.EM_DIAGNOSTICO }));
      repo.update.mockResolvedValue(makeOrder());

      const result = await service.accept(mechanicUser, 1, { accept: true });

      expect(repo.update).toHaveBeenCalled();
      expect(histService.logStatusChange).toHaveBeenCalled();
      expect(sqsPublisher.publish).toHaveBeenCalled();
    });

    it('should accept an order with budgetId and change to AGUARDANDO_INICIO', async () => {
      repo.findById
        .mockResolvedValueOnce(makeOrder({ budgetId: 100 }))
        .mockResolvedValueOnce(makeOrder({ budgetId: 100, mechanicId: 2, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));
      repo.update.mockResolvedValue(makeOrder());

      await service.accept(mechanicUser, 1, { accept: true });

      const updateCall = repo.update.mock.calls[0];
      expect(updateCall[1]).toMatchObject({ currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO });
    });

    it('should reject an order', async () => {
      repo.findById
        .mockResolvedValueOnce(makeOrder())
        .mockResolvedValueOnce(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.RECUSADA }));
      repo.update.mockResolvedValue(makeOrder());

      await service.accept(mechanicUser, 1, { accept: false });

      const updateCall = repo.update.mock.calls[0];
      expect(updateCall[1]).toMatchObject({ currentStatus: ServiceOrderStatus.RECUSADA });
    });

    it('should throw BadRequestServerException when order already has mechanic', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 99 }));

      await expect(service.accept(mechanicUser, 1, { accept: true })).rejects.toThrow(BadRequestServerException);
    });
  });

  describe('decideBudget', () => {
    it('should approve budget', async () => {
      repo.findById.mockResolvedValue(makeOrder({ currentStatus: ServiceOrderStatus.AGUARDANDO_APROVACAO, budgetId: 50 }));
      repo.update.mockResolvedValue(makeOrder({ currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));

      const result = await service.decideBudget(customerUser, 1, { accept: true });

      expect(sqsPublisher.publish).toHaveBeenCalled();
      expect(histService.logStatusChange).toHaveBeenCalled();
    });

    it('should reject budget', async () => {
      repo.findById.mockResolvedValue(makeOrder({ currentStatus: ServiceOrderStatus.AGUARDANDO_APROVACAO, budgetId: 50 }));
      repo.update.mockResolvedValue(makeOrder({ currentStatus: ServiceOrderStatus.RECUSADA }));

      await service.decideBudget(customerUser, 1, { accept: false });

      expect(sqsPublisher.publish).toHaveBeenCalled();
    });

    it('should throw ForbiddenServerException when customer is not the owner', async () => {
      const otherCustomer: AuthPayload = { sub: 999, email: 'other@test.com', type: 'customer' };
      repo.findById.mockResolvedValue(makeOrder({ customerId: 10 }));

      await expect(service.decideBudget(otherCustomer, 1, { accept: true })).rejects.toThrow(ForbiddenServerException);
    });

    it('should throw NotFoundServerException when update returns null', async () => {
      repo.findById.mockResolvedValue(makeOrder());
      repo.update.mockResolvedValue(null);

      await expect(service.decideBudget(customerUser, 1, { accept: true })).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('startRepair', () => {
    it('should start repair successfully', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));
      repo.update.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.EM_EXECUCAO }));

      const result = await service.startRepair(mechanicUser, 1);

      expect(repo.update).toHaveBeenCalledWith(1, { currentStatus: ServiceOrderStatus.EM_EXECUCAO });
    });

    it('should throw ForbiddenServerException if mechanic is not assigned', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 999, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));

      await expect(service.startRepair(mechanicUser, 1)).rejects.toThrow(ForbiddenServerException);
    });

    it('should throw ForbiddenServerException if no mechanic assigned', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: null, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));

      await expect(service.startRepair(mechanicUser, 1)).rejects.toThrow(ForbiddenServerException);
    });

    it('should throw BadRequestServerException if status is not AGUARDANDO_INICIO', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.RECEBIDA }));

      await expect(service.startRepair(mechanicUser, 1)).rejects.toThrow(BadRequestServerException);
    });

    it('should throw NotFoundServerException when update returns null', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));
      repo.update.mockResolvedValue(null);

      await expect(service.startRepair(mechanicUser, 1)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('finishRepair', () => {
    it('should finish repair successfully', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.EM_EXECUCAO }));
      repo.update.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.FINALIZADA }));

      const result = await service.finishRepair(mechanicUser, 1);

      expect(repo.update).toHaveBeenCalledWith(1, { currentStatus: ServiceOrderStatus.FINALIZADA });
    });

    it('should throw ForbiddenServerException if mechanic not assigned', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 999, currentStatus: ServiceOrderStatus.EM_EXECUCAO }));

      await expect(service.finishRepair(mechanicUser, 1)).rejects.toThrow(ForbiddenServerException);
    });

    it('should throw BadRequestServerException if not in EM_EXECUCAO', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.AGUARDANDO_INICIO }));

      await expect(service.finishRepair(mechanicUser, 1)).rejects.toThrow(BadRequestServerException);
    });

    it('should throw NotFoundServerException when update returns null', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.EM_EXECUCAO }));
      repo.update.mockResolvedValue(null);

      await expect(service.finishRepair(mechanicUser, 1)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('delivered', () => {
    it('should mark as delivered successfully', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.FINALIZADA }));
      repo.update.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.ENTREGUE }));

      const result = await service.delivered(mechanicUser, 1);

      expect(repo.update).toHaveBeenCalledWith(1, { currentStatus: ServiceOrderStatus.ENTREGUE });
    });

    it('should throw ForbiddenServerException if mechanic not assigned', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 999, currentStatus: ServiceOrderStatus.FINALIZADA }));

      await expect(service.delivered(mechanicUser, 1)).rejects.toThrow(ForbiddenServerException);
    });

    it('should throw NotFoundServerException if vehicleId is missing', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, vehicleId: 0 }));

      await expect(service.delivered(mechanicUser, 1)).rejects.toThrow(NotFoundServerException);
    });

    it('should throw NotFoundServerException when update returns null', async () => {
      repo.findById.mockResolvedValue(makeOrder({ mechanicId: 2, currentStatus: ServiceOrderStatus.FINALIZADA }));
      repo.update.mockResolvedValue(null);

      await expect(service.delivered(mechanicUser, 1)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('getExecutionTimeById', () => {
    it('should return execution time', async () => {
      histService.listByServiceOrder.mockResolvedValue([
        { id: '1', idServiceOrder: 1, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.RECEBIDA, changedAt: new Date('2024-01-01T10:00:00Z') },
        { id: '2', idServiceOrder: 1, userId: 2, oldStatus: ServiceOrderStatus.RECEBIDA, newStatus: ServiceOrderStatus.FINALIZADA, changedAt: new Date('2024-01-01T12:00:00Z') },
      ]);

      const result = await service.getExecutionTimeById(1);

      expect(result.executionTimeMs).toBe(7200000); // 2 hours
    });

    it('should throw when no history found', async () => {
      histService.listByServiceOrder.mockResolvedValue([]);

      await expect(service.getExecutionTimeById(1)).rejects.toThrow(BadRequestServerException);
    });

    it('should throw when RECEBIDA not found', async () => {
      histService.listByServiceOrder.mockResolvedValue([
        { id: '1', idServiceOrder: 1, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.FINALIZADA, changedAt: new Date() },
      ]);

      await expect(service.getExecutionTimeById(1)).rejects.toThrow(BadRequestServerException);
    });

    it('should throw when FINALIZADA not found', async () => {
      histService.listByServiceOrder.mockResolvedValue([
        { id: '1', idServiceOrder: 1, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.RECEBIDA, changedAt: new Date() },
      ]);

      await expect(service.getExecutionTimeById(1)).rejects.toThrow(BadRequestServerException);
    });

    it('should throw when FINALIZADA is before RECEBIDA', async () => {
      histService.listByServiceOrder.mockResolvedValue([
        { id: '1', idServiceOrder: 1, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.RECEBIDA, changedAt: new Date('2024-01-02T10:00:00Z') },
        { id: '2', idServiceOrder: 1, userId: 2, oldStatus: null, newStatus: ServiceOrderStatus.FINALIZADA, changedAt: new Date('2024-01-01T10:00:00Z') },
      ]);

      await expect(service.getExecutionTimeById(1)).rejects.toThrow(BadRequestServerException);
    });
  });

  describe('getAverageExecutionTime', () => {
    it('should calculate average execution time', async () => {
      repo.listFinishedOrDelivered.mockResolvedValue([makeOrder({ id: 1 }), makeOrder({ id: 2 })]);
      histService.listByServiceOrder
        .mockResolvedValueOnce([
          { id: '1', idServiceOrder: 1, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.RECEBIDA, changedAt: new Date('2024-01-01T10:00:00Z') },
          { id: '2', idServiceOrder: 1, userId: 2, oldStatus: null, newStatus: ServiceOrderStatus.FINALIZADA, changedAt: new Date('2024-01-01T12:00:00Z') },
        ])
        .mockResolvedValueOnce([
          { id: '3', idServiceOrder: 2, userId: 1, oldStatus: null, newStatus: ServiceOrderStatus.RECEBIDA, changedAt: new Date('2024-01-01T10:00:00Z') },
          { id: '4', idServiceOrder: 2, userId: 2, oldStatus: null, newStatus: ServiceOrderStatus.FINALIZADA, changedAt: new Date('2024-01-01T14:00:00Z') },
        ]);

      const result = await service.getAverageExecutionTime();

      expect(result.averageExecutionTimeMs).toBe(10800000); // (2h + 4h) / 2 = 3h
    });

    it('should throw when no finished orders found', async () => {
      repo.listFinishedOrDelivered.mockResolvedValue([]);

      await expect(service.getAverageExecutionTime()).rejects.toThrow(BadRequestServerException);
    });
  });
});
