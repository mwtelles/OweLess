import { Elysia } from 'elysia';
import { db } from './db/client';
import { users } from './db/schema';
import 'dotenv/config';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';

const app = new Elysia()
    .get('/health', () => ({ ok: true, service: 'OweLess-API' }))
    .use(authRoutes)
    .use(meRoutes)
    .get('/version', () => ({ version: '0.0.1' }))
    .get('/ping-db', async () => {
        const rows = await db.select({ id: users.id }).from(users).limit(1);
        return { db: 'ok', sample: rows[0] ?? null };
    });

const port = Number(process.env.APP_PORT ?? 1313);
app.listen(port);
console.log(`OweLess API running on http://localhost:${port}`);
