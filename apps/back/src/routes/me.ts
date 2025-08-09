import { Elysia } from 'elysia';
import { authMiddleware } from '../auth/middleware';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const meRoutes = new Elysia()
    .use(async (app) =>
        app.onBeforeHandle(authMiddleware)
    )
    .get('/me', async (ctx) => {
        // @ts-ignore set by middleware
        const userId = ctx.user?.id as number;
        const [u] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId));
        return { user: u ?? null };
    });
