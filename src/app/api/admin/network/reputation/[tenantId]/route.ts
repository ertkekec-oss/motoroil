import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { ReputationEngine } from '@/services/network/reputation/reputationEngine';
import { ReputationBreakdownService } from '@/services/network/reputation/reputationBreakdown';
import { AdminReputationProjection } from '@/services/network/reputation/projection/adminReputationProjection';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/reputation\/([^\/]+)$/);
        const tenantId = urlMatch ? urlMatch[1] : null;

        if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

        const score = await ReputationEngine.getReputationScore(tenantId);
        if (!score) return NextResponse.json(null);

        const breakdown = await ReputationBreakdownService.buildReputationBreakdown(tenantId);

        const signals = await prisma.networkReputationSignal.findMany({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { scoreImpact: 'asc' }
        });

        return NextResponse.json(AdminReputationProjection.projectFullDetail(score, breakdown, signals));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
