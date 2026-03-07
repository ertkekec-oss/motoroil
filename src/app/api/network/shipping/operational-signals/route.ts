import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';
import { OperationalProjection } from '@/services/shipping/projection/operationalProjection';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);

    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant required' }, { status: 400 });
    }

    try {
        const signals = await prisma.networkOperationalSignal.findMany({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json(
            signals.map(s => OperationalProjection.projectOperationalSignalForTenant(s))
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch operational signals' }, { status: 500 });
    }
}
