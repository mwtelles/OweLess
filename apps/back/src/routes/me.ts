import { Elysia } from 'elysia'
import { authMiddleware } from '../middlewares/auth'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const meRoutes = new Elysia({ prefix: '/me' })
    .use(authMiddleware)
    .get('/', async ({ userId, set }) => {
        const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
        if (!u) {
            set.status = 404
            return { error: 'User not found' }
        }
        return { id: u.id, email: u.email, createdAt: u.createdAt }
    })
