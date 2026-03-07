import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectTenantInsightForTenant } from '@/services/network/projection/marketProjection';
import { TenantMarketInsightType, TenantRecommendedAction } from '@prisma/client';

export async function GET(request: NextRequest) {
    const user = await getSession();
    const searchParams = request.nextUrl.searchParams;

    const insightType = searchParams.get('insightType') as TenantMarketInsightType | null;
    const recommendedAction = searchParams.get('recommendedAction') as TenantRecommendedAction | null;
    const priority = parseInt(searchParams.get('priority') || '0', 10);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { tenantId: user.companyId, status: 'ACTIVE', isStale: false };

    // Strict Tenant scoping filtering defaults
    where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
    ];

    if (insightType) where.insightType = insightType;
    if (recommendedAction) where.recommendedAction = recommendedAction;
    if (priority > 0) where.priority = priority;

    const insights = await prisma.tenantMarketInsight.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: [
            { priority: 'asc' }, // 1 is highest priority
            { score: 'desc' }
        ]
    });

    let nextCursor = null;
    if (insights.length > limit) {
        const nextItem = insights.pop();
        nextCursor = nextItem?.id;
    }

    return NextResponse.json({
        data: insights.map(projectTenantInsightForTenant),
        meta: { nextCursor }
    });
}
