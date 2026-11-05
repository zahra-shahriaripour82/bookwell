import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env'); // local only: Render has no .env file
}
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle(process.env.DATABASE_URL!);
