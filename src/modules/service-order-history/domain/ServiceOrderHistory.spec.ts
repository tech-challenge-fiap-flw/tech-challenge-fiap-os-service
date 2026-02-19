import { ServiceOrderHistoryEntity, IServiceOrderHistoryProps } from './ServiceOrderHistory';

describe('ServiceOrderHistoryEntity', () => {
  describe('create', () => {
    it('should create a history entry with changedAt date', () => {
      const entity = ServiceOrderHistoryEntity.create({
        idServiceOrder: 1,
        userId: 5,
        oldStatus: 'Recebida',
        newStatus: 'Em diagnóstico',
      });
      const json = entity.toJSON();

      expect(json.idServiceOrder).toBe(1);
      expect(json.userId).toBe(5);
      expect(json.oldStatus).toBe('Recebida');
      expect(json.newStatus).toBe('Em diagnóstico');
      expect(json.changedAt).toBeInstanceOf(Date);
      expect(json.id).toBeUndefined();
    });

    it('should create with null oldStatus', () => {
      const entity = ServiceOrderHistoryEntity.create({
        idServiceOrder: 2,
        userId: 3,
        oldStatus: null,
        newStatus: 'Recebida',
      });
      const json = entity.toJSON();

      expect(json.oldStatus).toBeNull();
      expect(json.newStatus).toBe('Recebida');
    });

    it('should create without oldStatus (undefined)', () => {
      const entity = ServiceOrderHistoryEntity.create({
        idServiceOrder: 3,
        userId: 1,
        newStatus: 'Recebida',
      });
      const json = entity.toJSON();

      expect(json.oldStatus).toBeUndefined();
    });
  });

  describe('restore', () => {
    it('should restore an entity from raw props', () => {
      const props: IServiceOrderHistoryProps = {
        id: 'abc123',
        idServiceOrder: 10,
        userId: 2,
        oldStatus: 'Em execução',
        newStatus: 'Finalizada',
        changedAt: new Date('2024-06-15'),
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15'),
      };

      const entity = ServiceOrderHistoryEntity.restore(props);
      const json = entity.toJSON();

      expect(json.id).toBe('abc123');
      expect(json.idServiceOrder).toBe(10);
      expect(json.changedAt).toEqual(new Date('2024-06-15'));
    });
  });

  describe('toJSON', () => {
    it('should return a shallow copy', () => {
      const entity = ServiceOrderHistoryEntity.create({
        idServiceOrder: 1,
        userId: 1,
        newStatus: 'Recebida',
      });
      const json1 = entity.toJSON();
      const json2 = entity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });
});
