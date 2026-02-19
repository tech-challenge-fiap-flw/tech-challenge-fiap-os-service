jest.mock('../../../infra/db/mysql', () => ({
  query: jest.fn(),
  insertOne: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
}));

import * as mysql from '../../../infra/db/mysql';
import { DiagnosisMySqlRepository } from './DiagnosisMySqlRepository';
import { DiagnosisEntity } from '../domain/Diagnosis';

const mockQuery = mysql.query as jest.Mock;
const mockInsertOne = mysql.insertOne as jest.Mock;

function makeDiagnosisRow(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    description: 'Motor falhando',
    creationDate: new Date('2024-01-01'),
    vehicleId: 10,
    mechanicId: 2,
    deletedAt: null,
    ...overrides,
  };
}

describe('DiagnosisMySqlRepository', () => {
  let repo: DiagnosisMySqlRepository;

  beforeEach(() => {
    repo = new DiagnosisMySqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert and return entity with id', async () => {
      mockInsertOne.mockResolvedValue({ insertId: 7 });

      const entity = DiagnosisEntity.create({
        description: 'Motor falhando',
        vehicleId: 10,
        mechanicId: 2,
      });

      const result = await repo.create(entity);

      expect(result.toJSON().id).toBe(7);
    });
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      mockQuery.mockResolvedValue([makeDiagnosisRow()]);

      const result = await repo.findById(1);

      expect(result?.toJSON().description).toBe('Motor falhando');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findById(99);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockQuery
        .mockResolvedValueOnce({})
        .mockResolvedValue([makeDiagnosisRow({ description: 'Updated' })]);

      const result = await repo.update(1, { description: 'Updated' });

      expect(result.toJSON().description).toBe('Updated');
    });

    it('should return existing entity when no keys to update', async () => {
      mockQuery.mockResolvedValue([makeDiagnosisRow()]);

      const result = await repo.update(1, {});

      expect(result.toJSON().id).toBe(1);
    });

    it('should throw 404 when entity not found after update', async () => {
      mockQuery
        .mockResolvedValueOnce({})
        .mockResolvedValue([]);

      await expect(repo.update(99, { description: 'X' })).rejects.toThrow('Diagnosis not found');
    });

    it('should throw 404 when empty update and entity not found', async () => {
      mockQuery.mockResolvedValue([]);

      await expect(repo.update(99, {})).rejects.toThrow('Diagnosis not found');
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
    it('should return list of entities', async () => {
      mockQuery.mockResolvedValue([makeDiagnosisRow(), makeDiagnosisRow({ id: 2 })]);

      const result = await repo.list(0, 10);

      expect(result).toHaveLength(2);
    });
  });

  describe('countAll', () => {
    it('should return count', async () => {
      mockQuery.mockResolvedValue([{ count: 5 }]);

      const result = await repo.countAll();

      expect(result).toBe(5);
    });

    it('should return 0 when no rows', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.countAll();

      expect(result).toBe(0);
    });
  });
});
