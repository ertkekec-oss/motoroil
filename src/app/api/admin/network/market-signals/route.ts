import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectMarketSignalForAdmin } from '@/services/network/projection/marketProjection';

export async function GET(request: NextRequest) {
    const user = await getSession();
    // MUST ADD REAL ROLE CHECK HERE IN FUTURE, MOCK OR IGNORE FOR NOW DEPENDING ON 'getSession'

    const searchParams = request.nextUrl.searchParams;

    // Admin filters
    const categoryId = searchParams.get('category');
    const signalType = searchParams.get('signalType');
    const scopeType = searchParams.get('scopeType');
    const regionCode = searchParams.get('region');
    const trendDirection = searchParams.get('trendDirection');
    const calculationVersion = searchParams.get('calculationVersion');
    const isStale = searchParams.get('staleFlag');
    const status = searchParams.get('status');
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0', 10);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (signalType) where.signalType = signalType;
    if (scopeType) where.signalScopeType = scopeType;
    if (regionCode) where.regionCode = regionCode;
    if (trendDirection) where.trendDirection = trendDirection;
    if (calculationVersion) where.calculationVersion = parseInt(calculationVersion, 10);
    if (isStale !== null) where.isStale = isStale === 'true';
    if (status) where.status = status;
    if (minConfidence > 0) where.confidenceScore = { gte: minConfidence };

    const signals = await prisma.networkMarketSignal.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: 'desc' }
    });

    let nextCursor = null;
    if (signals.length > limit) {
        const nextItem = signals.pop();
        nextCursor = nextItem?.id;
    }

    return NextResponse.json({
        data: signals.map(projectMarketSignalForAdmin),
        meta: { nextCursor }
    });
}
