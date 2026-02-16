import * as mysql from '../../infra/db/mysql';

export type TransactionFunction = <T>(fn: () => Promise<T>) => Promise<T>;

export interface IBaseRepository {
  transaction: TransactionFunction;
}

export class BaseRepository implements IBaseRepository {
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return await mysql.transaction(fn);
  }
}
