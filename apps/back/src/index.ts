import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { db } from './db/client'
import { users } from './db/schema'
import 'dotenv/config'

import { authRoutes } from './routes/auth'
import { meRoutes } from './routes/me'
import { debtRoutes } from './routes/debts'
import { installmentRoutes } from './routes/installments'

const ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

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
    .get('/version', () => ({ version: '0.0.1' }))
    .get('/ping-db', async () => {
        const rows = await db.select({ id: users.id }).from(users).limit(1)
        return { db: 'ok', sample: rows[0] ?? null }
    })

const port = Number(process.env.APP_PORT ?? 1313)
app.listen(port)
console.log(`OweLess API running on http://localhost:${port} (CORS: ${ORIGIN})`)
