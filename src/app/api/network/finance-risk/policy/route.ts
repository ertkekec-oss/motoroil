import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const history = await prisma.networkEscrowPolicyDecision.findMany({
            where: { buyerTenantId: tenantId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return NextResponse.json(history.map(h => ({
            date: h.createdAt,
            decision: h.decisionType,
            holdDays: h.holdDays,
            disputeWindow: h.disputeWindowHours
        })));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
