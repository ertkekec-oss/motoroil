import { prismaRaw as prisma } from "@/lib/prisma"

type RateLimitConfig = {
    key: string
    windowMs: number
    limit: number
}

export class RateLimitError extends Error {
    constructor(public retryAfterSec: number, public code = "RATE_LIMITED") {
        super(code)
    }
}

/**
 * Sliding window DB rate limiter
 * - counts events in last windowMs
 * - if under limit: inserts event
 * - if over: throws RateLimitError with retryAfter
 */
export async function consumeRateLimit(cfg: RateLimitConfig) {
    const now = Date.now()
    const windowStart = new Date(now - cfg.windowMs)

    // Transaction: count + insert (best-effort)
    // Not perfectly atomic under extreme concurrency, but good enough for OTP abuse control.
    // If you want stricter atomicity later, we can switch to Redis or pg advisory locks.
    const count = await prisma.rateLimitEvent.count({
        where: { key: cfg.key, createdAt: { gte: windowStart } },
    })

    if (count >= cfg.limit) {
        // retry-after ~ window remaining
        const oldest = await prisma.rateLimitEvent.findFirst({
            where: { key: cfg.key, createdAt: { gte: windowStart } },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
        })

        const retryAfterMs = oldest
            ? Math.max(1000, cfg.windowMs - (now - oldest.createdAt.getTime()))
            : cfg.windowMs

        throw new RateLimitError(Math.ceil(retryAfterMs / 1000))
    }

    await prisma.rateLimitEvent.create({ data: { key: cfg.key } })
}

/**
 * Periodic cleanup (optional): call occasionally
 * keeps table from growing forever.
 */
export async function cleanupRateLimitEvents(keepMs = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - keepMs)
    await prisma.rateLimitEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })
}
