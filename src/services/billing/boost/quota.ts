import { PrismaClient } from '@prisma/client';
import { getActiveBoostSubscription } from './subscriptions';

const prisma = new PrismaClient();
const activeQuotaCache = new Map<string, { quotaRemaining: number, expiresAt: number }>();

export async function hasSponsoredQuota(sellerTenantId: string): Promise<boolean> {
    const CACHE_TTL = 5 * 60 * 1000; // 5 min
    const now = Date.now();

    const cached = activeQuotaCache.get(sellerTenantId);
    if (cached && cached.expiresAt > now) {
         return cached.quotaRemaining > 0;
    }

    // Refresh from DB
    const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId: sellerTenantId } });
    if (policy?.boostPaused) {
         activeQuotaCache.set(sellerTenantId, { quotaRemaining: 0, expiresAt: now + CACHE_TTL });
         return false;
    }

    const sub = await getActiveBoostSubscription(sellerTenantId);
    if (!sub) {
         activeQuotaCache.set(sellerTenantId, { quotaRemaining: 0, expiresAt: now + CACHE_TTL });
         return false;
    }

    activeQuotaCache.set(sellerTenantId, { quotaRemaining: sub.remaining, expiresAt: now + CACHE_TTL });
    return sub.remaining > 0;
}

export function filterSponsoredQuota(listings: any[]) {
     return listings; // Not mutating arrays here directly usually better done at mapping layer if needed async
}
