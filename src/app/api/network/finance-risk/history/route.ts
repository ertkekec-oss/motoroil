import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const history = await prisma.networkTradeRiskScore.findMany({
            where: { buyerTenantId: tenantId, contextType: 'TENANT' },
            orderBy: { lastCalculatedAt: 'desc' },
            take: 30
        });

        return NextResponse.json(history.map(h => ({
            date: h.lastCalculatedAt,
            score: h.overallRiskScore,
            tier: h.riskTier
        })));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
