import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!, { max: 10 });
if (!sql) {
    throw new Error('DATABASE_URL is not set or invalid');
}
export const db = drizzle(sql);
console.log('Drizzle ORM initialized with PostgreSQL connection', 'DATABASE_URL set' + (process.env.DATABASE_URL ? '✅' : '❌'));
await sql`SET timezone = 'UTC'`;
console.log('Database timezone set to UTC', '✅');
