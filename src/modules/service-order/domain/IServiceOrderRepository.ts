import { IBaseRepository } from '../../../shared/domain/BaseRepository';
import { IServiceOrderProps, ServiceOrderEntity, ServiceOrderId } from './ServiceOrder';

export interface IServiceOrderRepository extends IBaseRepository {
  create(entity: ServiceOrderEntity): Promise<ServiceOrderEntity>;
  softDelete(id: ServiceOrderId): Promise<void>;
  findById(id: ServiceOrderId, userId?: number): Promise<ServiceOrderEntity | null>;
  update(id: ServiceOrderId, partial: Partial<IServiceOrderProps>): Promise<ServiceOrderEntity | null>;
  findActiveByBudgetId(budgetId: number): Promise<ServiceOrderEntity | null>;
  listFinishedOrDelivered(): Promise<ServiceOrderEntity[]>;
}
