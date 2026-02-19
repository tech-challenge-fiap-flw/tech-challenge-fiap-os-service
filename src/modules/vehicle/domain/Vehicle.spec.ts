import { VehicleEntity, IVehicleProps } from './Vehicle';

describe('VehicleEntity', () => {
  const validInput = {
    idPlate: 'ABC-1234',
    type: 'car',
    model: 'Civic',
    brand: 'Honda',
    manufactureYear: 2023,
    modelYear: 2024,
    color: 'Black',
    ownerId: 1,
  };

  describe('create', () => {
    it('should create a VehicleEntity with deletedAt as null', () => {
      const entity = VehicleEntity.create(validInput);
      const json = entity.toJSON();

      expect(json.idPlate).toBe('ABC-1234');
      expect(json.type).toBe('car');
      expect(json.model).toBe('Civic');
      expect(json.brand).toBe('Honda');
      expect(json.manufactureYear).toBe(2023);
      expect(json.modelYear).toBe(2024);
      expect(json.color).toBe('Black');
      expect(json.ownerId).toBe(1);
      expect(json.deletedAt).toBeNull();
    });
  });

  describe('restore', () => {
    it('should restore a VehicleEntity from raw props', () => {
      const props: IVehicleProps = {
        id: 10,
        idPlate: 'XYZ-9999',
        type: 'truck',
        model: 'Hilux',
        brand: 'Toyota',
        manufactureYear: 2020,
        modelYear: 2021,
        color: 'White',
        ownerId: 5,
        deletedAt: new Date('2024-06-01'),
      };

      const entity = VehicleEntity.restore(props);
      const json = entity.toJSON();

      expect(json.id).toBe(10);
      expect(json.idPlate).toBe('XYZ-9999');
      expect(json.deletedAt).toEqual(new Date('2024-06-01'));
    });
  });

  describe('toJSON', () => {
    it('should return a shallow copy', () => {
      const entity = VehicleEntity.create(validInput);
      const json1 = entity.toJSON();
      const json2 = entity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });
});
