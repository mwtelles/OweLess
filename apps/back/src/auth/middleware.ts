import type { Context } from 'elysia';
import { verifyToken } from './jwt';

export async function authMiddleware(ctx: Context) {
    const auth = ctx.request.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
        return new Response(JSON.stringify({ error: 'Missing Bearer token' }), { status: 401 });
    }

    try {
        const payload = await verifyToken<{ userId: number }>(token);
        // @ts-ignore – attach to context
        ctx.user = { id: payload.userId };
        return;
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401 });
    }
}
