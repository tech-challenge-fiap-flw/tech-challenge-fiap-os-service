export type VehicleId = number;

export interface IVehicleProps {
  id?: VehicleId;
  idPlate: string;
  type: string;
  model: string;
  brand: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  ownerId: number;
  deletedAt?: Date | null;
}

export class VehicleEntity {
  private props: IVehicleProps;
  private constructor(props: IVehicleProps) { this.props = props; }
  static create(props: Omit<IVehicleProps, 'id' | 'deletedAt'>): VehicleEntity {
    return new VehicleEntity({ ...props, deletedAt: null });
  }
  static restore(props: IVehicleProps): VehicleEntity { return new VehicleEntity(props); }
  toJSON(): IVehicleProps { return { ...this.props }; }
}
