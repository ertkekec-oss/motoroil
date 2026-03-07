import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { ReputationEngine } from '@/services/network/reputation/reputationEngine';
import { ReputationBreakdownService } from '@/services/network/reputation/reputationBreakdown';
import { TenantReputationProjection } from '@/services/network/reputation/projection/tenantReputationProjection';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const score = await ReputationEngine.getReputationScore(tenantId);
        if (!score) return NextResponse.json(null);

        const snapshot = await prisma.networkReputationSnapshot.findFirst({
            where: { tenantId },
            orderBy: { lastCalculatedAt: 'desc' }
        });

        const breakdown = await ReputationBreakdownService.buildReputationBreakdown(tenantId);

        return NextResponse.json(TenantReputationProjection.projectOverview(score, snapshot, breakdown));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
