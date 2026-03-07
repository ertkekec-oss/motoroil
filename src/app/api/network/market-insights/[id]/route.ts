import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectTenantInsightForTenant } from '@/services/network/projection/marketProjection';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession();

    const insight = await prisma.tenantMarketInsight.findUnique({
        where: { id: params.id }
    });

    if (!insight) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (insight.tenantId !== user.companyId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
        data: projectTenantInsightForTenant(insight as any)
    });
}
