import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { ReputationEngine } from '@/services/network/reputation/reputationEngine';
import { ReputationSignalsService } from '@/services/network/reputation/reputationSignals';
import { ReputationAuditService } from '@/services/network/reputation/reputationAudit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: any) {
    const { role, userId } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/reputation\/([^\/]+)\/restrict$/);
        const tenantId = urlMatch ? urlMatch[1] : null;

        if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

        const body = await req.json();

        // Hard manual lock for this tenant with severe weight
        const sig = ReputationSignalsService.buildSignal(
            tenantId,
            'ADMIN_RESTRICTION',
            'NEGATIVE',
            1000, // Immovable Weight
            -100, // Forces absolute drop
            `Manually restricted due to business decision: ${body.reason || 'Terminated Operations'}`
        );

        await prisma.networkReputationSignal.create({ data: sig });

        const score = await ReputationEngine.recalculateReputationScore(tenantId);
        ReputationAuditService.recordManualRestriction(tenantId, userId, body.reason);

        return NextResponse.json({ success: true, newTier: score.reputationTier });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
