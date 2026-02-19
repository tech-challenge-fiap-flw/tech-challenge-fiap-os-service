import { ServiceOrderHistoryService } from './ServiceOrderHistoryService';
import { IServiceOrderHistoryRepository } from '../domain/IServiceOrderHistoryRepository';
import { ServiceOrderHistoryEntity } from '../domain/ServiceOrderHistory';
import { IEmailService } from '../../../shared/mail/EmailService';
import { IServiceOrderRepository } from '../../service-order/domain/IServiceOrderRepository';
import { IUserRepository } from '../../user/domain/IUserRepository';
import { ServiceOrderEntity } from '../../service-order/domain/ServiceOrder';
import { UserEntity } from '../../user/domain/User';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';

function makeHistory(overrides: Record<string, any> = {}) {
  return ServiceOrderHistoryEntity.restore({
    id: 'hist1',
    idServiceOrder: 1,
    userId: 5,
    oldStatus: null,
    newStatus: 'Recebida',
    changedAt: new Date('2024-01-01'),
    ...overrides,
  });
}

function makeServiceOrder(overrides: Record<string, any> = {}) {
  return ServiceOrderEntity.restore({
    id: 1,
    description: 'Test',
    creationDate: new Date(),
    currentStatus: ServiceOrderStatus.RECEBIDA,
    budgetId: null,
    customerId: 10,
    mechanicId: null,
    vehicleId: 5,
    active: true,
    ...overrides,
  });
}

function makeUser(overrides: Record<string, any> = {}) {
  return UserEntity.restore({
    id: 10,
    name: 'John',
    email: 'john@test.com',
    password: 'hash',
    type: 'customer',
    active: true,
    creationDate: new Date(),
    cpf: '12345678901',
    phone: '11999',
    ...overrides,
  });
}

function makeMockRepo(): jest.Mocked<IServiceOrderHistoryRepository> {
  return {
    log: jest.fn(),
    listByServiceOrder: jest.fn(),
  };
}

function makeMockEmailService(): jest.Mocked<IEmailService> {
  return {
    send: jest.fn().mockResolvedValue(undefined),
  };
}

function makeMockServiceOrderRepo(): jest.Mocked<IServiceOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findActiveByBudgetId: jest.fn(),
    listFinishedOrDelivered: jest.fn(),
    transaction: jest.fn(),
  };
}

function makeMockUserRepo(): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

describe('ServiceOrderHistoryService', () => {
  let service: ServiceOrderHistoryService;
  let histRepo: jest.Mocked<IServiceOrderHistoryRepository>;
  let emailService: jest.Mocked<IEmailService>;
  let serviceOrderRepo: jest.Mocked<IServiceOrderRepository>;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    histRepo = makeMockRepo();
    emailService = makeMockEmailService();
    serviceOrderRepo = makeMockServiceOrderRepo();
    userRepo = makeMockUserRepo();
    service = new ServiceOrderHistoryService(histRepo, emailService, serviceOrderRepo, userRepo);
  });

  describe('logStatusChange', () => {
    it('should log status change and send email', async () => {
      const saved = makeHistory();
      histRepo.log.mockResolvedValue(saved);
      serviceOrderRepo.findById.mockResolvedValue(makeServiceOrder());
      userRepo.findById.mockResolvedValue(makeUser());

      const result = await service.logStatusChange({
        idServiceOrder: 1,
        userId: 5,
        oldStatus: null,
        newStatus: 'Recebida',
      });

      expect(histRepo.log).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
      expect(result.idServiceOrder).toBe(1);
    });

    it('should log status change without email when no dependencies', async () => {
      const serviceNoEmail = new ServiceOrderHistoryService(histRepo);
      histRepo.log.mockResolvedValue(makeHistory());

      const result = await serviceNoEmail.logStatusChange({
        idServiceOrder: 1,
        userId: 5,
        newStatus: 'Recebida',
      });

      expect(result.idServiceOrder).toBe(1);
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('should not throw when email sending fails', async () => {
      histRepo.log.mockResolvedValue(makeHistory());
      serviceOrderRepo.findById.mockResolvedValue(makeServiceOrder());
      userRepo.findById.mockResolvedValue(makeUser());
      emailService.send.mockRejectedValue(new Error('SMTP error'));

      const result = await service.logStatusChange({
        idServiceOrder: 1,
        userId: 5,
        newStatus: 'Recebida',
      });

      expect(result.idServiceOrder).toBe(1);
    });

    it('should handle when service order not found for email', async () => {
      histRepo.log.mockResolvedValue(makeHistory());
      serviceOrderRepo.findById.mockResolvedValue(null);

      const result = await service.logStatusChange({
        idServiceOrder: 1,
        userId: 5,
        newStatus: 'Recebida',
      });

      expect(result.idServiceOrder).toBe(1);
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('should handle when user not found for email', async () => {
      histRepo.log.mockResolvedValue(makeHistory());
      serviceOrderRepo.findById.mockResolvedValue(makeServiceOrder());
      userRepo.findById.mockResolvedValue(null);

      const result = await service.logStatusChange({
        idServiceOrder: 1,
        userId: 5,
        newStatus: 'Recebida',
      });

      expect(result.idServiceOrder).toBe(1);
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('listByServiceOrder', () => {
    it('should return list of history items', async () => {
      histRepo.listByServiceOrder.mockResolvedValue([makeHistory(), makeHistory({ id: 'hist2' })]);

      const result = await service.listByServiceOrder(1);

      expect(result).toHaveLength(2);
      expect(histRepo.listByServiceOrder).toHaveBeenCalledWith(1);
    });

    it('should return empty array', async () => {
      histRepo.listByServiceOrder.mockResolvedValue([]);

      const result = await service.listByServiceOrder(99);

      expect(result).toHaveLength(0);
    });
  });
});
