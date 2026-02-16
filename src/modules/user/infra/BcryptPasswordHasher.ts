import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../application/IPasswordHasher';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly rounds: number = 10) {}

  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(plain, salt);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
