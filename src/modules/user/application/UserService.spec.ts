import { UserService } from './UserService';
import { IUserRepository } from '../domain/IUserRepository';
import { IPasswordHasher } from './IPasswordHasher';
import { UserEntity } from '../domain/User';
import { BadRequestServerException, NotFoundServerException } from '../../../shared/application/ServerException';

function makeUser(overrides: Partial<ReturnType<UserEntity['toJSON']>> = {}) {
  return UserEntity.restore({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedpw',
    type: 'customer',
    active: true,
    creationDate: new Date('2024-01-01'),
    cpf: '12345678901',
    cnpj: null,
    phone: '11999999999',
    address: null,
    city: null,
    state: null,
    zipCode: null,
    ...overrides,
  });
}

function makeMockRepo(): jest.Mocked<IUserRepository> {
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

function makeMockHasher(): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true),
  };
}

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    repo = makeMockRepo();
    hasher = makeMockHasher();
    service = new UserService(repo, hasher);
  });

  describe('createUser', () => {
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secret123',
      type: 'customer',
      cpf: '12345678901',
      phone: '11999999999',
    };

    it('should create a user successfully', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeUser());

      const result = await service.createUser(input);

      expect(repo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(hasher.hash).toHaveBeenCalledWith('secret123');
      expect(repo.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('John Doe');
    });

    it('should throw BadRequestServerException when email already exists', async () => {
      repo.findByEmail.mockResolvedValue(makeUser());

      await expect(service.createUser(input)).rejects.toThrow(BadRequestServerException);
      await expect(service.createUser(input)).rejects.toThrow('Email already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.update.mockResolvedValue(makeUser({ name: 'Updated' }));

      const result = await service.updateUser(1, { name: 'Updated' });

      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.update).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(result).not.toHaveProperty('password');
    });

    it('should hash password when updating password', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.update.mockResolvedValue(makeUser());

      await service.updateUser(1, { password: 'newpass' });

      expect(hasher.hash).toHaveBeenCalledWith('newpass');
      expect(repo.update).toHaveBeenCalledWith(1, { password: 'hashed_password' });
    });

    it('should throw NotFoundServerException when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateUser(99, { name: 'X' })).rejects.toThrow(NotFoundServerException);
    });

    it('should throw NotFoundServerException when repo.update returns null', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.update.mockResolvedValue(null);

      await expect(service.updateUser(1, { name: 'X' })).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      repo.findById.mockResolvedValue(makeUser());
      repo.softDelete.mockResolvedValue();

      await service.deleteUser(1);

      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundServerException when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteUser(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      repo.findById.mockResolvedValue(makeUser());

      const result = await service.findById(1);

      expect(result.name).toBe('John Doe');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundServerException when user not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('findByEmail', () => {
    it('should return user entity', async () => {
      const user = makeUser();
      repo.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(result.toJSON().email).toBe('john@example.com');
    });

    it('should throw NotFoundServerException when user not found', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmail('unknown@test.com')).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('list', () => {
    it('should return users without passwords', async () => {
      repo.list.mockResolvedValue([makeUser(), makeUser({ id: 2, name: 'Jane' })]);

      const result = await service.list(0, 10);

      expect(result).toHaveLength(2);
      result.forEach(u => expect(u).not.toHaveProperty('password'));
    });

    it('should return empty array', async () => {
      repo.list.mockResolvedValue([]);

      const result = await service.list(0, 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('countAll', () => {
    it('should return count from repository', async () => {
      repo.countAll.mockResolvedValue(42);

      const result = await service.countAll();

      expect(result).toBe(42);
    });
  });
});
