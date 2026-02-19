import { BcryptPasswordHasher } from './BcryptPasswordHasher';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import bcrypt from 'bcrypt';

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher(10);
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash a password', async () => {
      const result = await hasher.hash('my-password');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('my-password', 'mock-salt');
      expect(result).toBe('hashed-password');
    });
  });

  describe('compare', () => {
    it('should return true for matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await hasher.compare('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await hasher.compare('wrong', 'hashed');

      expect(result).toBe(false);
    });
  });
});
