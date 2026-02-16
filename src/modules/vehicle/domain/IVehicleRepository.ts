import { VehicleEntity, VehicleId, IVehicleProps } from './Vehicle';

export interface IVehicleRepository {
  create(vehicle: VehicleEntity): Promise<VehicleEntity>;
  findById(id: VehicleId, userId?: number): Promise<VehicleEntity | null>;
  findByIdPlate(idPlate: string): Promise<VehicleEntity | null>;
  update(id: VehicleId, partial: Partial<IVehicleProps>, userId?: number): Promise<VehicleEntity | null>;
  softDelete(id: VehicleId): Promise<void>;
  list(offset: number, limit: number, userId?: number): Promise<VehicleEntity[]>;
  countAll(userId?: number): Promise<number>;
}
