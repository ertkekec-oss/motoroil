import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache medians in memory for a short time to avoid thrashing
const categoryMedianCache = new Map<string, { median: number; exp: number }>();

export async function getCategoryMedianPrice(categoryId: string): Promise<number | null> {
    const now = Date.now();
    const cached = categoryMedianCache.get(categoryId);
    if (cached && cached.exp > now) {
        return cached.median;
    }

    // Bounded query for recent listings in category
    const listings = await prisma.networkListing.findMany({
        where: {
            globalProduct: {
                categoryId
            },
            status: 'ACTIVE'
        },
        select: {
            price: true
        },
        take: 100,
        orderBy: {
            updatedAt: 'desc'
        }
    });

    if (listings.length === 0) return null;

    const prices = listings.map(l => Number(l.price)).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

    categoryMedianCache.set(categoryId, { median, exp: now + 5 * 60 * 1000 }); // 5 min cache
    return median;
}

export async function checkChurnPenalty(sellerCompanyId: string, listingId: string): Promise<boolean> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const flipsCount = await prisma.commerceAuditLog.count({
        where: {
            sellerCompanyId,
            entityId: listingId,
            action: {
                in: ['ACTIVATE_LISTING', 'PAUSE_LISTING']
            },
            createdAt: {
                gte: sevenDaysAgo
            }
        }
    });

    return flipsCount > 10;
}
