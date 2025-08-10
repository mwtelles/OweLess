import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db/client';
import { users } from './db/schema';
import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { authRoutes } from './routes/auth';
import { meRoutes } from './routes/me';
import { debtRoutes } from './routes/debts';
import { installmentRoutes } from './routes/installments';
import { paymentRoutes } from './routes/payments';
import { debtSummaryRoutes } from './routes/debts-summary';
import { dashboardRoutes } from './routes/dashboard';

const ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const port = Number(process.env.APP_PORT ?? 1313);

async function bootstrap() {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations applied successfully ✅');

    const app = new Elysia()
        .use(cors({
            origin: ORIGIN,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }))
        .get('/health', () => ({ ok: true, service: 'OweLess-API' }))

        .use(authRoutes)
        .use(meRoutes)
        .use(debtRoutes)
        .use(installmentRoutes)
        .use(paymentRoutes)
        .use(debtSummaryRoutes)
        .use(dashboardRoutes)

        .get('/version', () => ({ version: '0.0.1' }))
        .get('/ping-db', async () => {
            const rows = await db.select({ id: users.id }).from(users).limit(1);
            return { db: 'ok', sample: rows[0] ?? null };
        });

    app.listen(port);
    console.log(`OweLess API running on http://localhost:${port} (CORS: ${ORIGIN})`);
}

bootstrap().catch((err) => {
    console.error('❌ Failed to start server', err);
    process.exit(1);
});
