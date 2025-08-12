import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { db } from './db/client'
import { users } from './db/schema'
import { sql } from 'drizzle-orm'
import 'dotenv/config'
import { authRoutes } from './routes/auth'
import { meRoutes } from './routes/me'
import { debtRoutes } from './routes/debts'
import { installmentRoutes } from './routes/installments'
import { paymentRoutes } from './routes/payments'
import { debtSummaryRoutes } from './routes/debts-summary'
import { dashboardRoutes } from './routes/dashboard'
import { execSync } from 'node:child_process'

const ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'
const port = Number(process.env.APP_PORT ?? 1313)
const RUN_MIGRATIONS = (process.env.RUN_MIGRATIONS ?? 'true').toLowerCase() === 'true'

async function waitForDb(maxAttempts = 10) {
    let attempt = 0
    while (attempt < maxAttempts) {
        try {
            await db.execute(sql`SELECT 1`)
            return
        } catch (err) {
            attempt++
            const ms = Math.min(1000 * Math.pow(2, attempt), 10000)
            console.warn(`DB not ready (attempt ${attempt}) -> retry in ${ms}ms`)
            await new Promise(r => setTimeout(r, ms))
        }
    }
    throw new Error('DB not reachable after retries')
}

function pushMigrations() {
    try {
        execSync('bunx --bun drizzle-kit push', {
            stdio: 'inherit',
            timeout: 30_000
        })
        console.log('Migrations applied successfully ✅')
    } catch (err) {
        console.error('⚠️ drizzle-kit push failed. Server will still start.', err)
    }
}

async function bootstrap() {
    await waitForDb()

    if (RUN_MIGRATIONS) pushMigrations()
    else console.log('Skipping migrations (RUN_MIGRATIONS=false)')

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
            const rows = await db.select({ id: users.id }).from(users).limit(1)
            return { db: 'ok', sample: rows[0] ?? null }
        })

    app.listen({ port, hostname: '0.0.0.0' })
    console.log(`OweLess API running on http://localhost:${port} (CORS: ${ORIGIN})`)
}

bootstrap().catch((err) => {
    console.error('❌ Failed to start server', err)
    process.exit(1)
})
