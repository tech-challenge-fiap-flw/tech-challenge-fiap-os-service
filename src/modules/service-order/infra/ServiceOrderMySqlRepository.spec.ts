jest.mock('../../../infra/db/mysql', () => ({
  query: jest.fn(),
  insertOne: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
}));

import * as mysql from '../../../infra/db/mysql';
import { ServiceOrderMySqlRepository } from './ServiceOrderMySqlRepository';
import { ServiceOrderEntity } from '../domain/ServiceOrder';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';

const mockQuery = mysql.query as jest.Mock;
const mockInsertOne = mysql.insertOne as jest.Mock;
const mockUpdate = mysql.update as jest.Mock;

function makeOrderRow(overrides: Record<string, any> = {}) {
  return {
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
  };
}

describe('ServiceOrderMySqlRepository', () => {
  let repo: ServiceOrderMySqlRepository;

  beforeEach(() => {
    repo = new ServiceOrderMySqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert and return entity with id', async () => {
      mockInsertOne.mockResolvedValue({ insertId: 42 });

      const entity = ServiceOrderEntity.create({
        description: 'Troca de óleo',
        customerId: 10,
        vehicleId: 5,
        budgetId: null,
      });

      const result = await repo.create(entity);

      expect(result.toJSON().id).toBe(42);
    });
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      mockQuery.mockResolvedValue([makeOrderRow()]);

      const result = await repo.findById(1);

      expect(result?.toJSON().description).toBe('Troca de óleo');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findById(99);

      expect(result).toBeNull();
    });

    it('should filter by userId when provided', async () => {
      mockQuery.mockResolvedValue([makeOrderRow()]);

      await repo.findById(1, 10);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('customerId'), [1, 10]);
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockUpdate.mockResolvedValue({});
      mockQuery.mockResolvedValue([makeOrderRow({ currentStatus: ServiceOrderStatus.EM_DIAGNOSTICO })]);

      const result = await repo.update(1, { currentStatus: ServiceOrderStatus.EM_DIAGNOSTICO });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result?.toJSON().currentStatus).toBe(ServiceOrderStatus.EM_DIAGNOSTICO);
    });
  });

  describe('softDelete', () => {
    it('should set active=0', async () => {
      mockQuery.mockResolvedValue({});

      await repo.softDelete(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('active = 0'), [1]);
    });
  });

  describe('findActiveByBudgetId', () => {
    it('should return entity when found', async () => {
      mockQuery.mockResolvedValue([makeOrderRow({ budgetId: 50 })]);

      const result = await repo.findActiveByBudgetId(50);

      expect(result?.toJSON().budgetId).toBe(50);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findActiveByBudgetId(999);

      expect(result).toBeNull();
    });
  });

  describe('listFinishedOrDelivered', () => {
    it('should return list of finished/delivered orders', async () => {
      mockQuery.mockResolvedValue([
        makeOrderRow({ currentStatus: ServiceOrderStatus.FINALIZADA }),
        makeOrderRow({ id: 2, currentStatus: ServiceOrderStatus.ENTREGUE }),
      ]);

      const result = await repo.listFinishedOrDelivered();

      expect(result).toHaveLength(2);
    });

    it('should return empty array', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.listFinishedOrDelivered();

      expect(result).toHaveLength(0);
    });
  });
});
