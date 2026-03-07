import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { TenantReputationProjection } from '@/services/network/reputation/projection/tenantReputationProjection';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const signals = await prisma.networkReputationSignal.findMany({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return NextResponse.json(TenantReputationProjection.projectSignalsList(signals));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
