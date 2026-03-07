import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { TradeRiskEngine } from '@/services/network/financeRisk/tradeRiskEngine';
import { AdminRiskProjection } from '@/services/network/financeRisk/projection/adminRiskProjection';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/finance-risk\/([^\/]+)$/);
        const tenantId = urlMatch ? urlMatch[1] : null;

        if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

        const score = await TradeRiskEngine.getTradeRiskScore({ buyerTenantId: tenantId, contextType: 'TENANT' });
        if (!score) return NextResponse.json(null);

        const signals = await prisma.networkTradeRiskSignal.findMany({
            where: { buyerTenantId: tenantId, status: 'ACTIVE' },
            orderBy: { scoreImpact: 'desc' }
        });

        const policy = await prisma.networkEscrowPolicyDecision.findFirst({
            where: { buyerTenantId: tenantId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(AdminRiskProjection.projectFullDetail(score, signals, policy));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
