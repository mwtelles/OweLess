import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../auth/password';
import { signAccessToken } from '../auth/jwt';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72)
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72)
});

export const authRoutes = new Elysia({ prefix: '/auth' })
    .post('/register', async ({ body, set }) => {
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return { error: 'Invalid payload', details: parsed.error.flatten() };
        }
        const { email, password } = parsed.data;

        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            set.status = 409;
            return { error: 'Email already registered' };
        }

        const passwordHash = await hashPassword(password);
        const inserted = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });
        const userId = inserted[0].id;

        const token = await signAccessToken({ userId }, '1h');
        return { token, user: { id: userId, email } };
    }, {
        body: t.Object({ email: t.String(), password: t.String() })
    })
    .post('/login', async ({ body, set }) => {
        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return { error: 'Invalid payload', details: parsed.error.flatten() };
        }
        const { email, password } = parsed.data;

        const found = await db.select().from(users).where(eq(users.email, email));
        if (found.length === 0) {
            set.status = 401;
            return { error: 'Invalid credentials' };
        }

        const ok = await verifyPassword(password, found[0].passwordHash);
        if (!ok) {
            set.status = 401;
            return { error: 'Invalid credentials' };
        }

        const token = await signAccessToken({ userId: found[0].id }, '1h');
        return { token, user: { id: found[0].id, email } };
    }, {
        body: t.Object({ email: t.String(), password: t.String() })
    });
