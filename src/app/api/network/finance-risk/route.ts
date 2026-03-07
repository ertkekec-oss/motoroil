import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { TradeRiskEngine } from '@/services/network/financeRisk/tradeRiskEngine';
import { TenantRiskProjection } from '@/services/network/financeRisk/projection/tenantRiskProjection';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const score = await TradeRiskEngine.getTradeRiskScore({ buyerTenantId: tenantId, contextType: 'TENANT' });
        if (!score) return NextResponse.json(null);

        const paymentSnapshot = await prisma.networkPaymentReliabilitySnapshot.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { lastCalculatedAt: 'desc' }
        });

        const policy = await prisma.networkEscrowPolicyDecision.findFirst({
            where: { buyerTenantId: tenantId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(
            TenantRiskProjection.projectOverview(score, paymentSnapshot, { riskClass: score.disputeProbabilityScore > 50 ? 'HIGH' : 'LOW' }, policy)
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
