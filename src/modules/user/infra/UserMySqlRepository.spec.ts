jest.mock('../../../infra/db/mysql', () => ({
  query: jest.fn(),
  insertOne: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
}));

import * as mysql from '../../../infra/db/mysql';
import { UserMySqlRepository } from './UserMySqlRepository';
import { UserEntity } from '../domain/User';

const mockQuery = mysql.query as jest.Mock;
const mockInsertOne = mysql.insertOne as jest.Mock;
const mockUpdate = mysql.update as jest.Mock;

function makeUserEntity() {
  return UserEntity.restore({
    id: 1,
    name: 'John',
    email: 'john@test.com',
    password: 'hash',
    type: 'customer',
    active: true,
    creationDate: new Date('2024-01-01'),
    cpf: '12345678901',
    cnpj: null,
    phone: '11999',
    address: null,
    city: null,
    state: null,
    zipCode: null,
  });
}

describe('UserMySqlRepository', () => {
  let repo: UserMySqlRepository;

  beforeEach(() => {
    repo = new UserMySqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should insert user and return entity with id', async () => {
      mockInsertOne.mockResolvedValue({ insertId: 10 });

      const entity = UserEntity.create({
        name: 'John',
        email: 'john@test.com',
        password: 'hash',
        type: 'customer',
        cpf: '12345678901',
        phone: '11999',
      });

      const result = await repo.create(entity);
      const json = result.toJSON();

      expect(mockInsertOne).toHaveBeenCalled();
      expect(json.id).toBe(10);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockQuery.mockResolvedValue([{
        id: 1, name: 'John', email: 'john@test.com', password: 'hash',
        type: 'customer', active: true, creationDate: new Date(), cpf: '123', phone: '999',
      }]);

      const result = await repo.findById(1);

      expect(result).not.toBeNull();
      expect(result?.toJSON().id).toBe(1);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findById(99);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockQuery.mockResolvedValue([{
        id: 1, name: 'John', email: 'john@test.com', password: 'hash',
        type: 'customer', active: true, creationDate: new Date(), cpf: '123', phone: '999',
      }]);

      const result = await repo.findByEmail('john@test.com');

      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.findByEmail('unknown@test.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockUpdate.mockResolvedValue({});
      mockQuery.mockResolvedValue([{
        id: 1, name: 'Updated', email: 'john@test.com', password: 'hash',
        type: 'customer', active: true, creationDate: new Date(), cpf: '123', phone: '999',
      }]);

      const result = await repo.update(1, { name: 'Updated' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result?.toJSON().name).toBe('Updated');
    });
  });

  describe('softDelete', () => {
    it('should call update with active=0', async () => {
      mockUpdate.mockResolvedValue({});

      await repo.softDelete(1);

      expect(mockUpdate).toHaveBeenCalledWith(expect.stringContaining('active = 0'), [1]);
    });
  });

  describe('list', () => {
    it('should return list of users', async () => {
      mockQuery.mockResolvedValue([
        { id: 1, name: 'John', email: 'j@t.com', password: 'h', type: 'customer', active: true, creationDate: new Date(), cpf: '123', phone: '999' },
        { id: 2, name: 'Jane', email: 'ja@t.com', password: 'h', type: 'admin', active: true, creationDate: new Date(), cpf: '456', phone: '888' },
      ]);

      const result = await repo.list(0, 10);

      expect(result).toHaveLength(2);
    });
  });

  describe('countAll', () => {
    it('should return count', async () => {
      mockQuery.mockResolvedValue([{ count: 42 }]);

      const result = await repo.countAll();

      expect(result).toBe(42);
    });

    it('should return 0 when no rows', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await repo.countAll();

      expect(result).toBe(0);
    });
  });
});
