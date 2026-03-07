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
        const score = await prisma.networkShippingReliabilityScore.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            orderBy: { lastCalculatedAt: 'desc' }
        });

        return NextResponse.json(
            OperationalProjection.projectShippingReliabilityForTenant(score) || { message: 'No reliability score found.' }
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch shipping reliability' }, { status: 500 });
    }
}
