jest.mock('../../../infra/db/mysql', () => ({
  query: jest.fn(),
  insertOne: jest.fn(),
  update: jest.fn(),
  deleteByField: jest.fn(),
  transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
}));

import * as mysql from '../../../infra/db/mysql';
import { VehicleMySqlRepository } from './VehicleMySqlRepository';
import { VehicleEntity } from '../domain/Vehicle';

const mockQuery = mysql.query as jest.Mock;
const mockInsertOne = mysql.insertOne as jest.Mock;

function makeVehicleRow(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    idPlate: 'ABC-1234',
    type: 'car',
    model: 'Civic',
    brand: 'Honda',
    manufactureYear: 2023,
    modelYear: 2024,
    color: 'Black',
    ownerId: 1,
    deletedAt: null,
    ...overrides,
  };
}

describe('VehicleMySqlRepository', () => {
  let repo: VehicleMySqlRepository;

  beforeEach(() => {
    repo = new VehicleMySqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert vehicle and return entity with id', async () => {
      mockInsertOne.mockResolvedValue({ insertId: 5 });

      const entity = VehicleEntity.create({
        idPlate: 'ABC-1234',
        type: 'car',
        model: 'Civic',
        brand: 'Honda',
        manufactureYear: 2023,
        modelYear: 2024,
        color: 'Black',
        ownerId: 1,
      });

      const result = await repo.create(entity);

      expect(result.toJSON().id).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return vehicle when found', async () => {
      mockQuery.mockResolvedValue([makeVehicleRow()]);

      const result = await repo.findById(1);

      expect(result?.toJSON().idPlate).toBe('ABC-1234');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findById(99);

      expect(result).toBeNull();
    });

    it('should filter by userId when provided', async () => {
      mockQuery.mockResolvedValue([makeVehicleRow()]);

      await repo.findById(1, 5);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ownerId'), [1, 5]);
    });
  });

  describe('findByIdPlate', () => {
    it('should return vehicle when found', async () => {
      mockQuery.mockResolvedValue([makeVehicleRow()]);

      const result = await repo.findByIdPlate('ABC-1234');

      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findByIdPlate('XXX-0000');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockQuery.mockResolvedValueOnce({}).mockResolvedValue([makeVehicleRow({ color: 'Red' })]);

      const result = await repo.update(1, { color: 'Red' });

      expect(result?.toJSON().color).toBe('Red');
    });

    it('should filter by userId when provided', async () => {
      mockQuery.mockResolvedValueOnce({}).mockResolvedValue([makeVehicleRow()]);

      await repo.update(1, { color: 'Blue' }, 5);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('ownerId');
      expect(params).toContain(5);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      mockQuery.mockResolvedValue({});

      await repo.softDelete(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('deletedAt'), [1]);
    });
  });

  describe('list', () => {
    it('should return list of vehicles', async () => {
      mockQuery.mockResolvedValue([makeVehicleRow(), makeVehicleRow({ id: 2 })]);

      const result = await repo.list(0, 10);

      expect(result).toHaveLength(2);
    });

    it('should filter by userId', async () => {
      mockQuery.mockResolvedValue([]);

      await repo.list(0, 10, 5);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ownerId'));
    });
  });

  describe('countAll', () => {
    it('should return count', async () => {
      mockQuery.mockResolvedValue([{ count: 10 }]);

      const result = await repo.countAll();

      expect(result).toBe(10);
    });

    it('should filter by userId', async () => {
      mockQuery.mockResolvedValue([{ count: 3 }]);

      const result = await repo.countAll(5);

      expect(result).toBe(3);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ownerId'));
    });
  });
});
