import { Pool } from 'pg';
import { config } from './config.js';

export const pool = new Pool({
  connectionString: config.dbUrl,
  max: 10
});

export async function query<T = any>(text: string, params?: any[]) {
  const res = await pool.query<T>(text, params);
  return res;
}
