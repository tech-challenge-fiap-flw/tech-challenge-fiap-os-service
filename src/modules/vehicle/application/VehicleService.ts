import { VehicleEntity, IVehicleProps } from '../domain/Vehicle';
import { IVehicleRepository } from '../domain/IVehicleRepository';
import { IUserService } from '../../../modules/user/application/UserService';
import { BadRequestServerException, NotFoundServerException } from '../../../shared/application/ServerException';
import { AuthPayload } from '../../../modules/auth/AuthMiddleware';

export type CreateVehicleInput = Omit<IVehicleProps, 'id' | 'deletedAt'>;
export type VehicleOutput = ReturnType<VehicleEntity['toJSON']>;

export interface IVehicleService {
  createVehicle(input: CreateVehicleInput): Promise<VehicleOutput>;
  updateVehicle(id: number, partial: Partial<CreateVehicleInput>, user?: AuthPayload): Promise<VehicleOutput | null>;
  deleteVehicle(id: number, user?: AuthPayload): Promise<void>;
  findById(id: number, user?: AuthPayload): Promise<VehicleOutput>;
  list(offset: number, limit: number, user?: AuthPayload): Promise<VehicleOutput[]>;
  countAll(user?: AuthPayload): Promise<number>;
}

export class VehicleService implements IVehicleService {
  constructor(
    private readonly repo: IVehicleRepository,
    private readonly userService: IUserService
  ) {}

  async createVehicle(input: CreateVehicleInput): Promise<VehicleOutput> {
    const exists = await this.repo.findByIdPlate(input.idPlate);

    if (exists) {
      throw new BadRequestServerException('Plate already exists');
    }

    await this.userService.findById(input.ownerId);

    const entity = VehicleEntity.create(input);
    const created = await this.repo.create(entity);
    return created.toJSON();
  }

  async updateVehicle(id: number, partial: Partial<CreateVehicleInput>, user?: AuthPayload): Promise<VehicleOutput | null> {
    const userId = this.checkUserPermission(user);

    const updated = await this.repo.update(id, partial, userId);

    if (!updated) {
      throw new NotFoundServerException('Vehicle not found');
    }

    return updated.toJSON();
  }

  async deleteVehicle(id: number, user?: AuthPayload): Promise<void> {
    await this.findById(id, user);
    await this.repo.softDelete(id);
  }

  async findById(id: number, user?: AuthPayload): Promise<VehicleOutput> {
    const userId = this.checkUserPermission(user);

    const vehicle = await this.repo.findById(id, userId);

    if (!vehicle) {
      throw new NotFoundServerException('Vehicle not found');
    }

    return vehicle.toJSON();
  }

  async list(offset: number, limit: number, user?: AuthPayload): Promise<VehicleOutput[]> {
    const userId = this.checkUserPermission(user);

    const items = await this.repo.list(offset, limit, userId);

    return items.map(i => i.toJSON());
  }

  async countAll(user?: AuthPayload): Promise<number> {
    const userId = this.checkUserPermission(user);

    return this.repo.countAll(userId);
  }

  private checkUserPermission(user?: AuthPayload): number | undefined {
    if (!user) {
      return undefined;
    }

    return user.type !== 'admin' ? user.sub : undefined
  }
}
