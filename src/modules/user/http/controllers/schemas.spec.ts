import { createUserSchema, updateUserSchema } from './schemas';

describe('User Schemas', () => {
  describe('createUserSchema', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@test.com',
      password: 'secret123',
      type: 'customer',
      cpf: '12345678901',
      phone: '11999999999',
    };

    it('should accept valid input', () => {
      const result = createUserSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept valid input with optional fields', () => {
      const result = createUserSchema.safeParse({
        ...validInput,
        cnpj: '12345678000199',
        address: 'Rua Teste',
        city: 'SP',
        state: 'SP',
        zipCode: '01000-000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = createUserSchema.safeParse({ ...validInput, name: 'J' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createUserSchema.safeParse({ ...validInput, email: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = createUserSchema.safeParse({ ...validInput, password: '12345' });
      expect(result.success).toBe(false);
    });

    it('should reject short cpf', () => {
      const result = createUserSchema.safeParse({ ...validInput, cpf: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should accept partial input', () => {
      const result = updateUserSchema.safeParse({ name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = updateUserSchema.safeParse({ email: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
