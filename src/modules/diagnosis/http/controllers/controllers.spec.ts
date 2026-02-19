import { CreateDiagnosisController } from './CreateDiagnosisController';
import { GetDiagnosisController } from './GetDiagnosisController';
import { UpdateDiagnosisController } from './UpdateDiagnosisController';
import { DeleteDiagnosisController } from './DeleteDiagnosisController';
import { ListDiagnosesController } from './ListDiagnosesController';
import { IDiagnosisService } from '../../application/DiagnosisService';
import { HttpRequest } from '../../../../shared/http/Controller';

function makeMockService(): jest.Mocked<IDiagnosisService> {
  return {
    create: jest.fn(),
    updateDiagnosis: jest.fn(),
    deleteDiagnosis: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

describe('Diagnosis Controllers', () => {
  let service: jest.Mocked<IDiagnosisService>;

  beforeEach(() => {
    service = makeMockService();
  });

  describe('CreateDiagnosisController', () => {
    it('should create diagnosis and return 201', async () => {
      const controller = new CreateDiagnosisController(service);
      service.create.mockResolvedValue({ id: 1, description: 'Motor falhando' } as any);

      const req: HttpRequest = {
        body: { description: 'Motor falhando', vehicleId: 1 },
        params: {},
        query: {},
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.create).toHaveBeenCalled();
    });

    it('should throw on invalid body', async () => {
      const controller = new CreateDiagnosisController(service);
      const req: HttpRequest = { body: { description: 'ab' }, params: {}, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw when vehicleId is missing', async () => {
      const controller = new CreateDiagnosisController(service);
      const req: HttpRequest = { body: { description: 'Test description' }, params: {}, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('GetDiagnosisController', () => {
    it('should return diagnosis with 200', async () => {
      const controller = new GetDiagnosisController(service);
      service.findById.mockResolvedValue({ id: 1, description: 'Test' } as any);

      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(service.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('UpdateDiagnosisController', () => {
    it('should update diagnosis and return 200', async () => {
      const controller = new UpdateDiagnosisController(service);
      service.updateDiagnosis.mockResolvedValue({ id: 1, description: 'Updated' } as any);

      const req: HttpRequest = {
        body: { description: 'Updated description' },
        params: { id: '1' },
        query: {},
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(service.updateDiagnosis).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should throw on invalid body', async () => {
      const controller = new UpdateDiagnosisController(service);
      const req: HttpRequest = {
        body: { vehicleId: 'not-a-number' },
        params: { id: '1' },
        query: {},
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('DeleteDiagnosisController', () => {
    it('should delete diagnosis and return 204', async () => {
      const controller = new DeleteDiagnosisController(service);
      service.deleteDiagnosis.mockResolvedValue();

      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      const result = await controller.handle(req);

      expect(result.status).toBe(204);
      expect(service.deleteDiagnosis).toHaveBeenCalledWith(1);
    });
  });

  describe('ListDiagnosesController', () => {
    it('should list diagnoses with pagination', async () => {
      const controller = new ListDiagnosesController(service);
      service.list.mockResolvedValue([{ id: 1 } as any]);
      service.countAll.mockResolvedValue(1);

      const req: HttpRequest = {
        body: {},
        params: {},
        query: {},
        raw: { query: { page: '1', limit: '10' } } as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('items');
      expect(result.body).toHaveProperty('total');
    });
  });
});
