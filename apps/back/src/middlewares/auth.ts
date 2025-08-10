import { Elysia } from 'elysia'
import { verifyToken } from '../auth/jwt'

export const authMiddleware = new Elysia()
    .derive(async ({ headers, set }): Promise<{ userId: number }> => {
        const auth = headers['authorization'] || headers['Authorization']
        if (!auth || !auth.startsWith('Bearer ')) {
            set.status = 401
            throw new Error('Missing or invalid Authorization header')
        }
        const token = auth.slice('Bearer '.length).trim()
        const payload = await verifyToken<{ userId: number }>(token).catch(() => null)
        if (!payload?.userId) {
            set.status = 401
            throw new Error('Invalid or expired token')
        }
        return { userId: payload.userId }
    })
    .as('global')
