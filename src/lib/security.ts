import prisma from './prisma';

export async function rateLimit(ipOrUserId: string, action: string, windowMs: number = 60000, maxRequests: number = 20) {
    // En basic rate limits implementation inside DB. For high scale use Redis.
    const cutoff = new Date(Date.now() - windowMs);
    
    // Count events
    const reqCount = await prisma.rateLimitEvent.count({
        where: {
            actor: ipOrUserId,
            action: action,
            createdAt: { gt: cutoff }
        }
    });

    if (reqCount >= maxRequests) {
        return { success: false, remaining: 0 };
    }

    // Log the request
    await prisma.rateLimitEvent.create({
        data: {
            actor: ipOrUserId,
            action: action
        }
    });

    return { success: true, remaining: maxRequests - reqCount - 1 };
}

export async function checkIdempotency(key: string, actor: string) {
    if (!key) return null; // Opt-out
    
    const existing = await prisma.idempotencyKey.findUnique({
        where: { key_actor: { key, actor } }
    });

    // If existing and less than 24 hours old
    if (existing && new Date(existing.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
        return existing; // Already executed
    }

    // Register new key
    const newKey = await prisma.idempotencyKey.create({
        data: { key, actor, response: {} }
    });

    return newKey;
}
