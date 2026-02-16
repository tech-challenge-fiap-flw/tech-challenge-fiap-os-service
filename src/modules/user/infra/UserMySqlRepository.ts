import * as mysql from '../../../infra/db/mysql';
import { UserEntity, UserId, IUserProps } from '../domain/User';
import { IUserRepository } from '../domain/IUserRepository';

export class UserMySqlRepository implements IUserRepository {

  async create(user: UserEntity): Promise<UserEntity> {
    const data = user.toJSON();
    
    const sql = `INSERT INTO users (name, email, password, type, active, creationDate, cpf, cnpj, phone, address, city, state, zipCode)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
    const params = [
      data.name,
      data.email,
      data.password,
      data.type,
      data.active,
      data.creationDate,
      data.cpf,
      data.cnpj ?? null,
      data.phone,
      data.address ?? null,
      data.city ?? null,
      data.state ?? null,
      data.zipCode ?? null,
    ];

    const result = await mysql.insertOne(sql, params);

    return UserEntity.restore({ ...data, id: result.insertId });
  }

  async findById(id: UserId): Promise<UserEntity | null> {
    const rows = await mysql.query<IUserProps>(`SELECT * FROM users WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return null;
    }
    
    return UserEntity.restore(rows[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = await mysql.query<IUserProps>(`SELECT * FROM users WHERE email = ?`, [email]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return UserEntity.restore(rows[0]);
  }

  async update(id: UserId, partial: Partial<IUserProps>): Promise<UserEntity | null> {
    const keys = Object.keys(partial) as (keyof IUserProps)[];

    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const params = keys.map((k) => (partial as any)[k]);
    params.push(id);

    await mysql.update(`UPDATE users SET ${setClause} WHERE id = ?`, params);

    return await this.findById(id);
  }

  async softDelete(id: UserId): Promise<void> {
    await mysql.update(`UPDATE users SET active = 0 WHERE id = ?`, [id]);
  }

  async list(offset: number, limit: number): Promise<UserEntity[]> {
    const sql = `
      SELECT * FROM users 
      WHERE active = 1 
      ORDER BY id 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await mysql.query<IUserProps>(sql);

    return rows.map((row) => UserEntity.restore(row));
  }

  async countAll(): Promise<number> {
    const rows = await mysql.query<{ count: number }>(`SELECT COUNT(*) AS count FROM users WHERE active = 1`);
    return Number(rows.at(0)?.count ?? 0);
  }
}
