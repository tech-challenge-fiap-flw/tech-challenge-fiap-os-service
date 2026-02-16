import { ResultSetHeader } from 'mysql2';
import * as mysql from '../../../infra/db/mysql';
import { VehicleEntity, VehicleId, IVehicleProps } from '../domain/Vehicle';
import { IVehicleRepository } from '../domain/IVehicleRepository';

export class VehicleMySqlRepository implements IVehicleRepository {

  async create(vehicle: VehicleEntity): Promise<VehicleEntity> {
    const data = vehicle.toJSON();
    
    const sql = `INSERT INTO vehicles (idPlate, type, model, brand, manufactureYear, modelYear, color, ownerId, deletedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
    const params = [
      data.idPlate,
      data.type,
      data.model,
      data.brand,
      data.manufactureYear,
      data.modelYear,
      data.color,
      data.ownerId,
      data.deletedAt ?? null,
    ];

    const result = await mysql.insertOne(sql, params);
    
    return VehicleEntity.restore({ id: result.insertId, ...data });
  }

  async findById(id: VehicleId, userId?: number): Promise<VehicleEntity | null> {
    let sql = `SELECT * FROM vehicles WHERE id = ?`;
    const params: any[] = [id];

    if (userId) {
      sql += ` AND ownerId = ?`;
      params.push(userId);
    }

    const rows = await mysql.query<IVehicleProps>(sql, params);

    if (rows.length === 0) {
      return null;
    }

    return VehicleEntity.restore(rows[0]);
  }

  async findByIdPlate(idPlate: string): Promise<VehicleEntity | null> {
    const rows = await mysql.query<IVehicleProps>(`SELECT * FROM vehicles WHERE idPlate = ?`, [idPlate]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return VehicleEntity.restore(rows[0]);
  }

  async update(id: VehicleId, partial: Partial<IVehicleProps>, userId?: number): Promise<VehicleEntity | null> {
    const keys = Object.keys(partial) as (keyof IVehicleProps)[];
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const params = keys.map((k) => (partial as any)[k]);
    params.push(id);

    let sql = `UPDATE vehicles SET ${setClause} WHERE id = ?`;

    if (userId) {
      sql += ` AND ownerId = ?`;
      params.push(userId);
    }

    await mysql.query<ResultSetHeader>(sql, params);

    return await this.findById(id, userId);
  }

  async softDelete(id: VehicleId): Promise<void> {
    await mysql.query<ResultSetHeader>(`UPDATE vehicles SET deletedAt = NOW() WHERE id = ?`, [id]);
  }

  async list(offset: number, limit: number, userId?: number): Promise<VehicleEntity[]> {
    const sql = `
      SELECT * FROM vehicles 
      WHERE deletedAt IS NULL
      ${userId ? 'AND ownerId = ' + userId : ''}
      ORDER BY id 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await mysql.query<IVehicleProps>(sql);
    
    return rows.map((row) => VehicleEntity.restore(row));
  }

  async countAll(userId?: number): Promise<number> {
    const rows = await mysql.query<{ count: number }>(`SELECT COUNT(*) AS count FROM vehicles WHERE deletedAt IS NULL ${userId ? 'AND ownerId = ' + userId : ''}`);
    return Number(rows.at(0)?.count ?? 0);
  }
}
