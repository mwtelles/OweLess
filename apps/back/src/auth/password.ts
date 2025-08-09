export async function hashPassword(plain: string) {
    return await Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 12 });
}

export async function verifyPassword(plain: string, hash: string) {
    return await Bun.password.verify(plain, hash);
}
