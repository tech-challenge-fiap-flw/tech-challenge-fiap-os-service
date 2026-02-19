const mockInsertOne = jest.fn();
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockToArray = jest.fn();

jest.mock('../../../infra/mongo/mongo', () => ({
  getCollection: jest.fn().mockResolvedValue({
    insertOne: mockInsertOne,
    find: mockFind,
  }),
}));

import { ServiceOrderHistoryMongoRepository } from './ServiceOrderHistoryMongoRepository';
import { ServiceOrderHistoryEntity } from '../domain/ServiceOrderHistory';
import { ObjectId } from 'mongodb';

describe('ServiceOrderHistoryMongoRepository', () => {
  let repo: ServiceOrderHistoryMongoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ toArray: mockToArray });
    repo = new ServiceOrderHistoryMongoRepository();
  });

  describe('log', () => {
    it('should insert and return entity with generated id', async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const entity = ServiceOrderHistoryEntity.create({
        idServiceOrder: 1,
        userId: 10,
        oldStatus: 'RECEBIDA',
        newStatus: 'EM_DIAGNOSTICO',
      });

      const result = await repo.log(entity);
      const json = result.toJSON();

      expect(json.id).toBe(insertedId.toHexString());
      expect(json.idServiceOrder).toBe(1);
      expect(mockInsertOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('listByServiceOrder', () => {
    it('should return list of history entities sorted by changedAt', async () => {
      const id1 = new ObjectId();
      const id2 = new ObjectId();
      const now = new Date();

      mockToArray.mockResolvedValue([
        {
          _id: id1,
          idServiceOrder: 1,
          userId: 10,
          oldStatus: null,
          newStatus: 'RECEBIDA',
          changedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: id2,
          idServiceOrder: 1,
          userId: 10,
          oldStatus: 'RECEBIDA',
          newStatus: 'EM_DIAGNOSTICO',
          changedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await repo.listByServiceOrder(1);

      expect(result).toHaveLength(2);
      expect(result[0].toJSON().id).toBe(id1.toHexString());
      expect(result[1].toJSON().newStatus).toBe('EM_DIAGNOSTICO');
      expect(mockFind).toHaveBeenCalledWith({ idServiceOrder: 1 });
      expect(mockSort).toHaveBeenCalledWith({ changedAt: 1 });
    });

    it('should return empty array when no history', async () => {
      mockToArray.mockResolvedValue([]);

      const result = await repo.listByServiceOrder(999);

      expect(result).toHaveLength(0);
    });
  });
});
