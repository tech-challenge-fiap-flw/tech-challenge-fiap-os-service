import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus'

export type ServiceOrderId = number;

export interface IServiceOrderProps {
  id: ServiceOrderId;
  description: string;
  creationDate: Date;
  currentStatus: ServiceOrderStatus;
  budgetId?: number | null;
  customerId: number;
  mechanicId?: number | null;
  vehicleId: number;
  active: boolean;
}

export class ServiceOrderEntity {
  private constructor(private props: IServiceOrderProps) {}

  static create(input: Omit<IServiceOrderProps, 'id' | 'creationDate' | 'currentStatus' | 'active'>) {
    return new ServiceOrderEntity({
      id: 0,
      description: input.description,
      creationDate: new Date(),
      currentStatus: ServiceOrderStatus.RECEBIDA,
      budgetId: input.budgetId ?? null,
      customerId: input.customerId,
      mechanicId: input.mechanicId ?? null,
      vehicleId: input.vehicleId,
      active: true,
    });
  }

  static restore(props: IServiceOrderProps) {
    return new ServiceOrderEntity(props);
  }

  toJSON() { return { ...this.props }; }
}
