import { acceptSchema, createSchema } from './scremas';

describe('ServiceOrder Schemas', () => {
  describe('acceptSchema', () => {
    it('should accept valid input with accept=true', () => {
      const result = acceptSchema.safeParse({ accept: true });
      expect(result.success).toBe(true);
    });

    it('should accept valid input with accept=false', () => {
      const result = acceptSchema.safeParse({ accept: false });
      expect(result.success).toBe(true);
    });

    it('should reject missing accept', () => {
      const result = acceptSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean accept', () => {
      const result = acceptSchema.safeParse({ accept: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('createSchema', () => {
    it('should accept valid input', () => {
      const result = createSchema.safeParse({
        description: 'Troca de óleo',
        vehicleId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept with optional budgetId', () => {
      const result = createSchema.safeParse({
        description: 'Troca de óleo',
        vehicleId: 1,
        budgetId: 10,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty description', () => {
      const result = createSchema.safeParse({
        description: '',
        vehicleId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing vehicleId', () => {
      const result = createSchema.safeParse({
        description: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer vehicleId', () => {
      const result = createSchema.safeParse({
        description: 'Test',
        vehicleId: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });
});
