import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : new pg.Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
      ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

export const db = drizzle(pool, { schema });
export { pool };
