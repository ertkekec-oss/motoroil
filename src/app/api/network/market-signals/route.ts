import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectMarketSignalForTenant } from '@/services/network/projection/marketProjection';
import { NetworkMarketSignalType, NetworkTrendDirection } from '@prisma/client';

export async function GET(request: NextRequest) {
    const user = await getSession();
    const searchParams = request.nextUrl.searchParams;

    const categoryId = searchParams.get('categoryId');
    const signalType = searchParams.get('signalType') as NetworkMarketSignalType | null;
    const regionCode = searchParams.get('regionCode');
    const trendDirection = searchParams.get('trendDirection') as NetworkTrendDirection | null;
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0', 10);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { status: 'ACTIVE', isStale: false };

    // Tenant endpoints automatically filter out expired records 
    where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
    ];

    if (categoryId) where.categoryId = categoryId;
    if (signalType) where.signalType = signalType;
    if (regionCode) where.regionCode = regionCode;
    if (trendDirection) where.trendDirection = trendDirection;
    if (minConfidence > 0) where.confidenceScore = { gte: minConfidence };

    const signals = await prisma.networkMarketSignal.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: [
            { intensityScore: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    let nextCursor = null;
    if (signals.length > limit) {
        const nextItem = signals.pop();
        nextCursor = nextItem?.id;
    }

    return NextResponse.json({
        data: signals.map(projectMarketSignalForTenant),
        meta: { nextCursor }
    });
}
