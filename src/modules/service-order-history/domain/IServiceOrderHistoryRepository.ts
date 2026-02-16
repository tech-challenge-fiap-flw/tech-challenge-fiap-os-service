import { ServiceOrderHistoryEntity } from './ServiceOrderHistory';

export interface IServiceOrderHistoryRepository {
  log(entity: ServiceOrderHistoryEntity): Promise<ServiceOrderHistoryEntity>;
  listByServiceOrder(idServiceOrder: number): Promise<ServiceOrderHistoryEntity[]>;
}
