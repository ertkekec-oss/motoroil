import prisma from '@/lib/prisma';

export async function markExpiredSignals(now: Date = new Date()) {
    const result: any[] = [];

    result.push(await prisma.networkRecommendation.updateMany({
        where: { expiresAt: { lte: now }, status: 'ACTIVE' },
        data: { status: 'EXPIRED', isStale: true }
    }));

    result.push(await prisma.networkInventorySignal.updateMany({
        where: { expiresAt: { lte: now }, status: 'ACTIVE' },
        data: { status: 'EXPIRED', isStale: true }
    }));

    result.push(await prisma.networkTradeOpportunity.updateMany({
        where: { expiresAt: { lte: now }, status: 'ACTIVE' },
        data: { status: 'EXPIRED', isStale: true }
    }));

    return result;
}
