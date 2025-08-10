import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const isProd = process.env.NODE_ENV === 'production';
const schemaPath = isProd ? './dist/db/schema.js' : './src/db/schema.ts';

const dbCreds = process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : undefined;

export default {
    schema: schemaPath,
    out: './drizzle',
    dialect: 'postgresql',
    ...(dbCreds ? { dbCredentials: dbCreds } : {}),
    strict: true,
    verbose: true
} satisfies Config;
