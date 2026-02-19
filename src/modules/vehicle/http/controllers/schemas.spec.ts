import { createVehicleSchema, updateVehicleSchema } from './schemas';

describe('Vehicle Schemas', () => {
  describe('createVehicleSchema', () => {
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

    it('should accept valid input', () => {
      const result = createVehicleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject short plate', () => {
      const result = createVehicleSchema.safeParse({ ...validInput, idPlate: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should reject empty type', () => {
      const result = createVehicleSchema.safeParse({ ...validInput, type: '' });
      expect(result.success).toBe(false);
    });

    it('should reject year before 1900', () => {
      const result = createVehicleSchema.safeParse({ ...validInput, manufactureYear: 1800 });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive ownerId', () => {
      const result = createVehicleSchema.safeParse({ ...validInput, ownerId: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer ownerId', () => {
      const result = createVehicleSchema.safeParse({ ...validInput, ownerId: 1.5 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateVehicleSchema', () => {
    it('should accept partial input', () => {
      const result = updateVehicleSchema.safeParse({ color: 'Red' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateVehicleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
