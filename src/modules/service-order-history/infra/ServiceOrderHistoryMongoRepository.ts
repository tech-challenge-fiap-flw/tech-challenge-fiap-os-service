import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../../../infra/mongo/mongo';
import { IServiceOrderHistoryRepository } from '../domain/IServiceOrderHistoryRepository';
import { ServiceOrderHistoryEntity, IServiceOrderHistoryProps } from '../domain/ServiceOrderHistory';

interface ServiceOrderHistoryDocument extends Omit<IServiceOrderHistoryProps, 'id'> {
  _id: ObjectId
}

export class ServiceOrderHistoryMongoRepository implements IServiceOrderHistoryRepository {
  private collectionPromise: Promise<Collection<ServiceOrderHistoryDocument>>;

  constructor() {
    this.collectionPromise = getCollection<ServiceOrderHistoryDocument>('service_order_history');
  }

  private async collection() {
    return this.collectionPromise;
  }

  async log(entity: ServiceOrderHistoryEntity): Promise<ServiceOrderHistoryEntity> {
    const data = entity.toJSON();
    const col = await this.collection();
    const { id, ...persist } = data;
    const result = await col.insertOne(persist as any);

    return ServiceOrderHistoryEntity.restore({
      ...data,
      id: result.insertedId.toHexString()
    });
  }

  async listByServiceOrder(idServiceOrder: number): Promise<ServiceOrderHistoryEntity[]> {
    const col = await this.collection();
    const cursor = col.find({ idServiceOrder }).sort({ changedAt: 1 });
    const docs = await cursor.toArray();

    return docs.map(d =>
      ServiceOrderHistoryEntity.restore({
        id: d._id.toHexString(),
        idServiceOrder: d.idServiceOrder,
        userId: d.userId,
        oldStatus: d.oldStatus,
        newStatus: d.newStatus,
        changedAt: d.changedAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      })
    );
  }
}
