import { SignJWT, jwtVerify } from 'jose';
import 'dotenv/config';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signAccessToken(payload: object, expiresIn = '1h') {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(expiresIn)
        .setIssuedAt()
        .sign(secret);
}

export async function verifyToken<T = any>(token: string): Promise<T> {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
}
