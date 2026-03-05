import crypto from 'crypto';

export function generateSigningToken(): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return { rawToken, tokenHash };
}

export function verifyTokenHash(rawToken: string, storedHash: string): boolean {
    const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
}
