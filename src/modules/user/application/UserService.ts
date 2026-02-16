import { UserEntity } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';
import { BadRequestServerException, NotFoundServerException } from '../../../shared/application/ServerException';
import { IPasswordHasher } from './IPasswordHasher';

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  type: string;
  cpf: string;
  cnpj?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type UserOutput = Omit<ReturnType<UserEntity['toJSON']>, 'password'>;

export interface IUserService {
  createUser(input: CreateUserInput): Promise<UserOutput>;
  updateUser(id: number, partial: Partial<CreateUserInput>): Promise<UserOutput | null>;
  deleteUser(id: number): Promise<void>;
  findById(id: number): Promise<UserOutput>;
  findByEmail(email: string): Promise<UserEntity>;
  list(offset: number, limit: number): Promise<UserOutput[]>;
  countAll(): Promise<number>;
}

export class UserService implements IUserService {
  constructor(
    private readonly repo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async createUser(input: CreateUserInput): Promise<UserOutput> {
    const exists = await this.repo.findByEmail(input.email);

    if (exists) {
      throw new BadRequestServerException('Email already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const entity = UserEntity.create({ ...input, password: hashedPassword });
    const created = await this.repo.create(entity);
    const { password, ...rest } = created.toJSON();

    return rest;
  }
  async updateUser(id: number, partial: Partial<CreateUserInput>): Promise<UserOutput> {
    const user = await this.repo.findById(id);

    if (!user) {
      throw new NotFoundServerException('User not found');
    }

    if (partial.password) {
      partial.password = await this.passwordHasher.hash(partial.password);
    }

    const updated = await this.repo.update(id, partial as any);

    if (!updated) {
      throw new NotFoundServerException('User not found');
    }

    const { password, ...rest } = updated.toJSON();
    return rest as UserOutput;
  }

  async deleteUser(id: number): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async findById(id: number): Promise<UserOutput> {
    const user = await this.repo.findById(id);

    if (!user) {
      throw new NotFoundServerException('User not found');
    }

    const { password, ...rest } = user.toJSON();

    return rest as UserOutput;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.repo.findByEmail(email);

    if (!user) {
      throw new NotFoundServerException('User not found');
    }

    return user;
  }

  async list(offset: number, limit: number): Promise<UserOutput[]> {
    const items = await this.repo.list(offset, limit);

    return items.map(i => {
      const { password, ...rest } = i.toJSON();

      return rest as UserOutput;
    });
  }

  async countAll(): Promise<number> {
    return this.repo.countAll();
  }
}
