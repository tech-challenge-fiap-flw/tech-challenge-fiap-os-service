import { ServiceOrderEntity, IServiceOrderProps } from './ServiceOrder';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';

describe('ServiceOrderEntity', () => {
  describe('create', () => {
    it('should create a ServiceOrderEntity with default values', () => {
      const entity = ServiceOrderEntity.create({
        description: 'Troca de óleo',
        customerId: 1,
        vehicleId: 2,
        budgetId: null,
      });
      const json = entity.toJSON();

      expect(json.id).toBe(0);
      expect(json.description).toBe('Troca de óleo');
      expect(json.customerId).toBe(1);
      expect(json.vehicleId).toBe(2);
      expect(json.budgetId).toBeNull();
      expect(json.mechanicId).toBeNull();
      expect(json.currentStatus).toBe(ServiceOrderStatus.RECEBIDA);
      expect(json.active).toBe(true);
      expect(json.creationDate).toBeInstanceOf(Date);
    });

    it('should create with optional budgetId and mechanicId', () => {
      const entity = ServiceOrderEntity.create({
        description: 'Revisão completa',
        customerId: 5,
        vehicleId: 10,
        budgetId: 100,
        mechanicId: 3,
      });
      const json = entity.toJSON();

      expect(json.budgetId).toBe(100);
      expect(json.mechanicId).toBe(3);
    });

    it('should default budgetId and mechanicId to null when not provided', () => {
      const entity = ServiceOrderEntity.create({
        description: 'Teste',
        customerId: 1,
        vehicleId: 1,
      });
      const json = entity.toJSON();

      expect(json.budgetId).toBeNull();
      expect(json.mechanicId).toBeNull();
    });
  });

  describe('restore', () => {
    it('should restore a ServiceOrderEntity from raw props', () => {
      const props: IServiceOrderProps = {
        id: 42,
        description: 'Alinhamento',
        creationDate: new Date('2024-06-01'),
        currentStatus: ServiceOrderStatus.EM_EXECUCAO,
        budgetId: 10,
        customerId: 3,
        mechanicId: 7,
        vehicleId: 5,
        active: true,
      };

      const entity = ServiceOrderEntity.restore(props);
      const json = entity.toJSON();

      expect(json.id).toBe(42);
      expect(json.currentStatus).toBe(ServiceOrderStatus.EM_EXECUCAO);
      expect(json.mechanicId).toBe(7);
    });
  });

  describe('toJSON', () => {
    it('should return a shallow copy of props', () => {
      const entity = ServiceOrderEntity.create({
        description: 'Test',
        customerId: 1,
        vehicleId: 1,
        budgetId: null,
      });
      const json1 = entity.toJSON();
      const json2 = entity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });
});
