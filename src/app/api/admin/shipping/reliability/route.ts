import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';
import { OperationalProjection } from '@/services/shipping/projection/operationalProjection';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    try {
        const query: any = { status: 'ACTIVE' };
        if (tenantId) query.tenantId = tenantId;

        const scores = await prisma.networkShippingReliabilityScore.findMany({
            where: query,
            orderBy: { lastCalculatedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(
            scores.map(s => OperationalProjection.projectShippingReliabilityForAdmin(s))
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch reliability scores' }, { status: 500 });
    }
}
