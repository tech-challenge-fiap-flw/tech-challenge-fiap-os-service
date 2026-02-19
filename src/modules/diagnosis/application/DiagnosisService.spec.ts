import { DiagnosisService } from './DiagnosisService';
import { IDiagnosisRepository } from '../domain/IDiagnosisRepository';
import { IVehicleService } from '../../vehicle/application/VehicleService';
import { IUserService } from '../../user/application/UserService';
import { DiagnosisEntity } from '../domain/Diagnosis';
import { NotFoundServerException } from '../../../shared/application/ServerException';

function makeDiagnosis(overrides: Record<string, any> = {}) {
  return DiagnosisEntity.restore({
    id: 1,
    description: 'Motor falhando',
    creationDate: new Date('2024-01-01'),
    vehicleId: 10,
    mechanicId: 2,
    deletedAt: null,
    ...overrides,
  });
}

function makeMockRepo(): jest.Mocked<IDiagnosisRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
    transaction: jest.fn().mockImplementation((fn: () => Promise<any>) => fn()),
  };
}

function makeMockVehicleService(): jest.Mocked<IVehicleService> {
  return {
    createVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    deleteVehicle: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: 10, idPlate: 'XYZ' }),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

function makeMockUserService(): jest.Mocked<IUserService> {
  return {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: 2, name: 'Mechanic' }),
    findByEmail: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

describe('DiagnosisService', () => {
  let service: DiagnosisService;
  let repo: jest.Mocked<IDiagnosisRepository>;
  let vehicleService: jest.Mocked<IVehicleService>;
  let userService: jest.Mocked<IUserService>;

  beforeEach(() => {
    repo = makeMockRepo();
    vehicleService = makeMockVehicleService();
    userService = makeMockUserService();
    service = new DiagnosisService(repo, vehicleService, userService);
  });

  describe('create', () => {
    it('should create a diagnosis successfully', async () => {
      repo.create.mockResolvedValue(makeDiagnosis());

      const result = await service.create({
        description: 'Motor falhando',
        vehicleId: 10,
        mechanicId: 2,
      });

      expect(vehicleService.findById).toHaveBeenCalledWith(10);
      expect(userService.findById).toHaveBeenCalledWith(2);
      expect(repo.create).toHaveBeenCalled();
      expect(result.description).toBe('Motor falhando');
    });

    it('should create without mechanicId', async () => {
      repo.create.mockResolvedValue(makeDiagnosis({ mechanicId: null }));

      const result = await service.create({
        description: 'Barulho',
        vehicleId: 10,
      });

      expect(userService.findById).not.toHaveBeenCalled();
      expect(result.description).toBe('Motor falhando');
    });

    it('should run inside a transaction', async () => {
      repo.create.mockResolvedValue(makeDiagnosis());

      await service.create({ description: 'Test', vehicleId: 10 });

      expect(repo.transaction).toHaveBeenCalled();
    });
  });

  describe('updateDiagnosis', () => {
    it('should update diagnosis successfully', async () => {
      repo.findById.mockResolvedValue(makeDiagnosis());
      repo.update.mockResolvedValue(makeDiagnosis({ description: 'Updated' }));

      const result = await service.updateDiagnosis(1, { description: 'Updated' });

      expect(result.description).toBe('Updated');
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateDiagnosis(99, { description: 'X' })).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('deleteDiagnosis', () => {
    it('should soft delete diagnosis', async () => {
      repo.findById.mockResolvedValue(makeDiagnosis());
      repo.softDelete.mockResolvedValue();

      await service.deleteDiagnosis(1);

      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteDiagnosis(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('findById', () => {
    it('should return diagnosis', async () => {
      repo.findById.mockResolvedValue(makeDiagnosis());

      const result = await service.findById(1);

      expect(result.id).toBe(1);
    });

    it('should throw NotFoundServerException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundServerException);
    });
  });

  describe('list', () => {
    it('should return list of diagnoses', async () => {
      repo.list.mockResolvedValue([makeDiagnosis(), makeDiagnosis({ id: 2 })]);

      const result = await service.list(0, 10);

      expect(result).toHaveLength(2);
    });
  });

  describe('countAll', () => {
    it('should return the count', async () => {
      repo.countAll.mockResolvedValue(5);

      const result = await service.countAll();

      expect(result).toBe(5);
    });
  });
});
