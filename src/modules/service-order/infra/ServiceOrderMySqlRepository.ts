import * as mysql from '../../../infra/db/mysql';
import { IServiceOrderProps, ServiceOrderEntity, ServiceOrderId } from '../domain/ServiceOrder';
import { IServiceOrderRepository } from '../domain/IServiceOrderRepository';
import { BaseRepository } from '../../../shared/domain/BaseRepository';
import { ResultSetHeader } from 'mysql2';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';

export class ServiceOrderMySqlRepository extends BaseRepository implements IServiceOrderRepository {
  async create(entity: ServiceOrderEntity): Promise<ServiceOrderEntity> {
    const data = entity.toJSON();

    const sql = `
      INSERT INTO service_orders (
        description,
        budgetId,
        customerId,
        mechanicId,
        vehicleId,
        creationDate,
        currentStatus,
        active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.description,
      data.budgetId ?? null,
      data.customerId,
      data.mechanicId ?? null,
      data.vehicleId,
      data.creationDate,
      data.currentStatus,
      data.active
    ];

    const response = await mysql.insertOne(sql, params);

    return ServiceOrderEntity.restore({ ...data, id: response.insertId });
  }

  async findById(id: ServiceOrderId, userId?: number): Promise<ServiceOrderEntity | null> {
    let sql = `SELECT * FROM service_orders WHERE id = ?`;
    const params: any[] = [id];

    if (userId !== undefined) {
      sql += ` AND customerId = ?`;
      params.push(userId);
    }

    const rows = await mysql.query<IServiceOrderProps>(sql, params);

    if (rows.length === 0) {
      return null;
    }
    
    return ServiceOrderEntity.restore(rows[0]);
  }

  async update(id: ServiceOrderId, partial: Partial<IServiceOrderProps>): Promise<ServiceOrderEntity | null> {
    const keys = Object.keys(partial) as (keyof IServiceOrderProps)[];

    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const params = keys.map((k) => (partial as any)[k]);
    params.push(id);

    await mysql.update(`UPDATE service_orders SET ${setClause} WHERE id = ?`, params);

    return await this.findById(id);
  }

  async softDelete(id: ServiceOrderId): Promise<void> {
    await mysql.query<ResultSetHeader>(`UPDATE service_orders SET active = 0 WHERE id = ?`, [id]);
  }

  async findActiveByBudgetId(budgetId: number): Promise<ServiceOrderEntity | null> {
    const rows = await mysql.query<IServiceOrderProps>(
      `SELECT * FROM service_orders WHERE budgetId = ? AND active = 1 LIMIT 1`,
      [budgetId]
    );

    if (!rows.length) {
      return null;
    }

    return ServiceOrderEntity.restore(rows[0]);
  }

  async listFinishedOrDelivered(): Promise<ServiceOrderEntity[]> {
    const rows = await mysql.query<IServiceOrderProps>(
      `SELECT * FROM service_orders WHERE currentStatus IN ('${ServiceOrderStatus.FINALIZADA}','${ServiceOrderStatus.ENTREGUE}') AND active = 1`
    );

    return rows.map(r => ServiceOrderEntity.restore(r));
  }
}
