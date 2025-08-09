import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(sql);
