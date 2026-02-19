import { createDiagnosisSchema, updateDiagnosisSchema } from './schemas';

describe('Diagnosis Schemas', () => {
  describe('createDiagnosisSchema', () => {
    it('should accept valid input', () => {
      const result = createDiagnosisSchema.safeParse({
        description: 'Motor falhando',
        vehicleId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept input with optional mechanicId', () => {
      const result = createDiagnosisSchema.safeParse({
        description: 'Motor falhando',
        vehicleId: 1,
        mechanicId: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject short description', () => {
      const result = createDiagnosisSchema.safeParse({
        description: 'ab',
        vehicleId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive vehicleId', () => {
      const result = createDiagnosisSchema.safeParse({
        description: 'Motor falhando',
        vehicleId: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing vehicleId', () => {
      const result = createDiagnosisSchema.safeParse({
        description: 'Motor falhando',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateDiagnosisSchema', () => {
    it('should accept partial input', () => {
      const result = updateDiagnosisSchema.safeParse({ description: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateDiagnosisSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
