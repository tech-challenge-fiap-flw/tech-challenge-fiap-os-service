import { loginSchema } from './schemas';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid input', () => {
      const result = loginSchema.safeParse({ email: 'test@test.com', password: 'secret' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-email', password: 'secret' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'test@test.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({ password: 'secret' });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({ email: 'test@test.com' });
      expect(result.success).toBe(false);
    });
  });
});
