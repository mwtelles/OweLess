import 'dotenv/config';
import type { Config } from 'drizzle-kit';
const isProd = process.env.NODE_ENV === 'production';
const schemaPath = isProd ? './dist/db/schema.js' : './src/db/schema.ts';

export default {
    schema: schemaPath,
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL! },
    strict: true,
    verbose: true,
} satisfies Config;
