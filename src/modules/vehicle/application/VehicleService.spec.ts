import { VehicleService } from './VehicleService';
import { IVehicleRepository } from '../domain/IVehicleRepository';
import { IUserService } from '../../user/application/UserService';
import { VehicleEntity } from '../domain/Vehicle';
import { BadRequestServerException, NotFoundServerException } from '../../../shared/application/ServerException';
import { AuthPayload } from '../../auth/AuthMiddleware';

function makeVehicle(overrides: Record<string, any> = {}) {
  return VehicleEntity.restore({
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
  });
}

function makeMockRepo(): jest.Mocked<IVehicleRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdPlate: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

function makeMockUserService(): jest.Mocked<IUserService> {
  return {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: 1, name: 'Owner' }),
    findByEmail: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

describe('VehicleService', () => {
  let service: VehicleService;
  let repo: jest.Mocked<IVehicleRepository>;
  let userService: jest.Mocked<IUserService>;

  beforeEach(() => {
    repo = makeMockRepo();
    userService = makeMockUserService();
    service = new VehicleService(repo, userService);
  });

  describe('createVehicle', () => {
    const input = {
      idPlate: 'ABC-1234',
      type: 'car',
      model: 'Civic',
      brand: 'Honda',
      manufactureYear: 2023,
      modelYear: 2024,
      color: 'Black',
      ownerId: 1,
    };

    it('should create a vehicle successfully', async () => {
      repo.findByIdPlate.mockResolvedValue(null);
      repo.create.mockResolvedValue(makeVehicle());

      const result = await service.createVehicle(input);

      expect(repo.findByIdPlate).toHaveBeenCalledWith('ABC-1234');
      expect(userService.findById).toHaveBeenCalledWith(1);
      expect(repo.create).toHaveBeenCalled();
      expect(result.idPlate).toBe('ABC-1234');
    });

    it('should throw BadRequestServerException when plate already exists', async () => {
      repo.findByIdPlate.mockResolvedValue(makeVehicle());

      await expect(service.createVehicle(input)).rejects.toThrow(BadRequestServerException);
      await expect(service.createVehicle(input)).rejects.toThrow('Plate already exists');
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle for admin user', async () => {
      const adminUser: AuthPayload = { sub: 10, email: 'admin@test.com', type: 'admin' };
      repo.update.mockResolvedValue(makeVehicle({ color: 'Red' }));

      const result = await service.updateVehicle(1, { color: 'Red' }, adminUser);

      expect(repo.update).toHaveBeenCalledWith(1, { color: 'Red' }, undefined);
      expect(result?.color).toBe('Red');
    });

    it('should update vehicle for customer user with userId filter', async () => {
      const customerUser: AuthPayload = { sub: 5, email: 'cust@test.com', type: 'customer' };
      repo.update.mockResolvedValue(makeVehicle({ color: 'Blue' }));

      await service.updateVehicle(1, { color: 'Blue' }, customerUser);

      expect(repo.update).toHaveBeenCalledWith(1, { color: 'Blue' }, 5);
    });

    it('should throw NotFoundServerException when vehicle not found', async () => {
      repo.update.mockResolvedValue(null);

      await expect(service.updateVehicle(99, { color: 'Blue' })).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle successfully', async () => {
      repo.findById.mockResolvedValue(makeVehicle());
      repo.softDelete.mockResolvedValue();

      await service.deleteVehicle(1);

      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundServerException when vehicle not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteVehicle(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('findById', () => {
    it('should return vehicle for admin', async () => {
      const admin: AuthPayload = { sub: 1, email: 'a@a.com', type: 'admin' };
      repo.findById.mockResolvedValue(makeVehicle());

      const result = await service.findById(1, admin);

      expect(repo.findById).toHaveBeenCalledWith(1, undefined);
      expect(result.idPlate).toBe('ABC-1234');
    });

    it('should filter by userId for customer', async () => {
      const customer: AuthPayload = { sub: 5, email: 'c@c.com', type: 'customer' };
      repo.findById.mockResolvedValue(makeVehicle());

      await service.findById(1, customer);

      expect(repo.findById).toHaveBeenCalledWith(1, 5);
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('list', () => {
    it('should list vehicles', async () => {
      repo.list.mockResolvedValue([makeVehicle(), makeVehicle({ id: 2 })]);

      const result = await service.list(0, 10);

      expect(result).toHaveLength(2);
    });

    it('should pass userId for non-admin', async () => {
      const customer: AuthPayload = { sub: 3, email: 'c@c.com', type: 'customer' };
      repo.list.mockResolvedValue([]);

      await service.list(0, 10, customer);

      expect(repo.list).toHaveBeenCalledWith(0, 10, 3);
    });
  });

  describe('countAll', () => {
    it('should return count for admin', async () => {
      const admin: AuthPayload = { sub: 1, email: 'a@a.com', type: 'admin' };
      repo.countAll.mockResolvedValue(5);

      const result = await service.countAll(admin);

      expect(result).toBe(5);
      expect(repo.countAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass userId for customer', async () => {
      const customer: AuthPayload = { sub: 3, email: 'c@c.com', type: 'customer' };
      repo.countAll.mockResolvedValue(2);

      const result = await service.countAll(customer);

      expect(result).toBe(2);
      expect(repo.countAll).toHaveBeenCalledWith(3);
    });
  });
});
