import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { ReputationEngine } from '@/services/network/reputation/reputationEngine';
import { ReputationSignalsService } from '@/services/network/reputation/reputationSignals';
import { ReputationAuditService } from '@/services/network/reputation/reputationAudit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/reputation\/([^\/]+)\/watchlist$/);
        const tenantId = urlMatch ? urlMatch[1] : null;

        if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

        const body = await req.json();

        // Admin injects a hard WATCHLIST signal
        const sig = ReputationSignalsService.buildSignal(
            tenantId,
            'WATCHLIST_PATTERN',
            'NEGATIVE',
            100, // Highest Weight
            -20, // Severity
            `Admin requested Watchlist monitor: ${body.reason || 'Manual Review'}`
        );

        await prisma.networkReputationSignal.create({ data: sig });

        // Trigger cascade to enforce rules immediately
        const score = await ReputationEngine.recalculateReputationScore(tenantId);
        ReputationAuditService.recordWatchlistTrigger(tenantId, [body.reason]);

        return NextResponse.json({ success: true, newTier: score.reputationTier });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
