import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
      }
    : {
        host: process.env.SQL_HOST || 'localhost',
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres',
        password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DB_NAME || 'postgres',
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
});
