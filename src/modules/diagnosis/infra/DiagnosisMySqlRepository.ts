import { ResultSetHeader } from 'mysql2';
import * as mysql from '../../../infra/db/mysql';
import { DiagnosisEntity, DiagnosisId, IDiagnosisProps } from '../domain/Diagnosis';
import { IDiagnosisRepository } from '../domain/IDiagnosisRepository';
import { BaseRepository } from '../../../shared/domain/BaseRepository';

export class DiagnosisMySqlRepository extends BaseRepository implements IDiagnosisRepository {

  async create(entity: DiagnosisEntity): Promise<DiagnosisEntity> {
    const data = entity.toJSON();

    const sql = `INSERT INTO diagnosis (description, creationDate, vehicleId, responsibleMechanicId, deletedAt)
                 VALUES (?, ?, ?, ?, ?)`;

    const params = [
      data.description,
      data.creationDate,
      data.vehicleId,
      data.mechanicId ?? null,
      data.deletedAt ?? null
    ];

    const result = await mysql.insertOne(sql, params);

    return DiagnosisEntity.restore({ ...data, id: result.insertId });
  }

  async findById(id: DiagnosisId): Promise<DiagnosisEntity | null> {
    const rows = await mysql.query<IDiagnosisProps>(`SELECT * FROM diagnosis WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return null;
    }

    return DiagnosisEntity.restore(rows[0]);
  }

  async update(id: DiagnosisId, partial: Partial<IDiagnosisProps>): Promise<DiagnosisEntity> {
    const keys = Object.keys(partial) as (keyof IDiagnosisProps)[];

    if (keys.length === 0) {
      const found = await this.findById(id);

      if (!found) {
        throw Object.assign(new Error('Diagnosis not found'), { status: 404 });
      }

      return found;
    }

    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const params = keys.map((k) => (partial as any)[k]);
    params.push(id);

    await mysql.query<ResultSetHeader>(`UPDATE diagnosis SET ${setClause} WHERE id = ?`, params);

    const updated = await this.findById(id);

    if (!updated) {
      throw Object.assign(new Error('Diagnosis not found'), { status: 404 });
    }

    return updated;
  }

  async softDelete(id: DiagnosisId): Promise<void> {
    await mysql.query<ResultSetHeader>(`UPDATE diagnosis SET deletedAt = NOW() WHERE id = ?`, [id]);
  }

  async list(offset: number, limit: number): Promise<DiagnosisEntity[]> {
    const sql = `
      SELECT * FROM diagnosis 
      WHERE deletedAt IS NULL
      ORDER BY id 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await mysql.query<IDiagnosisProps>(sql);

    return rows.map((row) => DiagnosisEntity.restore(row));
  }

  async countAll(): Promise<number> {
    const rows = await mysql.query<{ count: number }>(`SELECT COUNT(*) AS count FROM diagnosis WHERE deletedAt IS NULL`);
    return Number(rows.at(0)?.count ?? 0);
  }
}
