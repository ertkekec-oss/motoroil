import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectTenantInsightForAdmin } from '@/services/network/projection/marketProjection';

export async function GET(request: NextRequest) {
    const user = await getSession();

    const searchParams = request.nextUrl.searchParams;

    const tenantId = searchParams.get('tenantId');
    const insightType = searchParams.get('insightType');
    const recommendedAction = searchParams.get('recommendedAction');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const calculationVersion = searchParams.get('calculationVersion');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (insightType) where.insightType = insightType;
    if (recommendedAction) where.recommendedAction = recommendedAction;
    if (priority) where.priority = parseInt(priority, 10);
    if (status) where.status = status;
    if (calculationVersion) where.calculationVersion = parseInt(calculationVersion, 10);

    const insights = await prisma.tenantMarketInsight.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { createdAt: 'desc' }
    });

    let nextCursor = null;
    if (insights.length > limit) {
        const nextItem = insights.pop();
        nextCursor = nextItem?.id;
    }

    return NextResponse.json({
        data: insights.map(projectTenantInsightForAdmin),
        meta: { nextCursor }
    });
}
