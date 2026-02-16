import * as mysql from '../db/mysql';

export class IdempotencyStore {
  async isProcessed(eventId: string): Promise<boolean> {
    const result = await mysql.query('SELECT 1 FROM processed_events WHERE event_id = ?', [eventId]);
    return result.length > 0;
  }

  async markProcessed(eventId: string): Promise<void> {
    await mysql.insertOne('INSERT IGNORE INTO processed_events (event_id, processed_at) VALUES (?, NOW())', [eventId]);
  }
}
