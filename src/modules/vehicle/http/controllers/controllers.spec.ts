import { CreateVehicleController } from './CreateVehicleController';
import { GetVehicleController } from './GetVehicleController';
import { UpdateVehicleController } from './UpdateVehicleController';
import { DeleteVehicleController } from './DeleteVehicleController';
import { ListVehiclesController } from './ListVehiclesController';
import { IVehicleService } from '../../application/VehicleService';
import { HttpRequest } from '../../../../shared/http/Controller';

function makeMockService(): jest.Mocked<IVehicleService> {
  return {
    createVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    deleteVehicle: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    countAll: jest.fn(),
  };
}

const adminUser = { sub: 1, email: 'admin@test.com', type: 'admin' };
const customerUser = { sub: 5, email: 'cust@test.com', type: 'customer' };

describe('Vehicle Controllers', () => {
  let service: jest.Mocked<IVehicleService>;

  beforeEach(() => {
    service = makeMockService();
  });

  describe('CreateVehicleController', () => {
    it('should create vehicle and return 201', async () => {
      const controller = new CreateVehicleController(service);
      service.createVehicle.mockResolvedValue({ id: 1, idPlate: 'ABC-1234' } as any);

      const req: HttpRequest = {
        body: {
          idPlate: 'ABC-1234',
          type: 'car',
          model: 'Civic',
          brand: 'Honda',
          manufactureYear: 2023,
          modelYear: 2024,
          color: 'Black',
          ownerId: 1,
        },
        params: {},
        query: {},
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(201);
      expect(service.createVehicle).toHaveBeenCalled();
    });

    it('should throw on invalid body', async () => {
      const controller = new CreateVehicleController(service);
      const req: HttpRequest = { body: { idPlate: '' }, params: {}, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('GetVehicleController', () => {
    it('should return vehicle with 200', async () => {
      const controller = new GetVehicleController(service);
      service.findById.mockResolvedValue({ id: 1 } as any);

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no user', async () => {
      const controller = new GetVehicleController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('UpdateVehicleController', () => {
    it('should update vehicle and return 200', async () => {
      const controller = new UpdateVehicleController(service);
      service.updateVehicle.mockResolvedValue({ id: 1, color: 'Red' } as any);

      const req: HttpRequest = {
        body: { color: 'Red' },
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
    });

    it('should throw when no user', async () => {
      const controller = new UpdateVehicleController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });

    it('should throw on invalid body', async () => {
      const controller = new UpdateVehicleController(service);
      const req: HttpRequest = {
        body: { manufactureYear: 'not-a-number' },
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('DeleteVehicleController', () => {
    it('should delete vehicle and return 204', async () => {
      const controller = new DeleteVehicleController(service);
      service.deleteVehicle.mockResolvedValue();

      const req: HttpRequest = {
        body: {},
        params: { id: '1' },
        query: {},
        user: customerUser,
        raw: {} as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(204);
    });

    it('should throw when no user', async () => {
      const controller = new DeleteVehicleController(service);
      const req: HttpRequest = { body: {}, params: { id: '1' }, query: {}, raw: {} as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });

  describe('ListVehiclesController', () => {
    it('should list vehicles with pagination', async () => {
      const controller = new ListVehiclesController(service);
      service.list.mockResolvedValue([{ id: 1 } as any]);
      service.countAll.mockResolvedValue(1);

      const req: HttpRequest = {
        body: {},
        params: {},
        query: {},
        user: adminUser,
        raw: { query: { page: '1', limit: '10' } } as any,
      };

      const result = await controller.handle(req);

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('items');
    });

    it('should throw when no user', async () => {
      const controller = new ListVehiclesController(service);
      const req: HttpRequest = { body: {}, params: {}, query: {}, raw: { query: {} } as any };

      await expect(controller.handle(req)).rejects.toThrow();
    });
  });
});
