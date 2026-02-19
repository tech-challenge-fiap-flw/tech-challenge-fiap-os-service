import { logHistorySchema, listHistorySchema } from './schemas';

describe('ServiceOrderHistory Schemas', () => {
  describe('logHistorySchema', () => {
    it('should accept valid input', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 1,
        userId: 5,
        newStatus: 'Recebida',
      });
      expect(result.success).toBe(true);
    });

    it('should accept with optional oldStatus', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 1,
        userId: 5,
        oldStatus: 'Recebida',
        newStatus: 'Em diagnóstico',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null oldStatus', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 1,
        userId: 5,
        oldStatus: null,
        newStatus: 'Recebida',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty newStatus', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 1,
        userId: 5,
        newStatus: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive idServiceOrder', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 0,
        userId: 5,
        newStatus: 'Recebida',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive userId', () => {
      const result = logHistorySchema.safeParse({
        idServiceOrder: 1,
        userId: 0,
        newStatus: 'Recebida',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listHistorySchema', () => {
    it('should accept valid input', () => {
      const result = listHistorySchema.safeParse({ idServiceOrder: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject non-positive idServiceOrder', () => {
      const result = listHistorySchema.safeParse({ idServiceOrder: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject missing idServiceOrder', () => {
      const result = listHistorySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
