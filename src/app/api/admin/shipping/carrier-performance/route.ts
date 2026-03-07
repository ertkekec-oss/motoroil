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
    const carrierCode = searchParams.get('carrierCode');

    try {
        const query: any = { status: 'ACTIVE' };
        if (carrierCode) query.carrierCode = carrierCode;

        const snapshots = await prisma.networkCarrierPerformanceSnapshot.findMany({
            where: query,
            orderBy: { lastCalculatedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(
            snapshots.map(s => OperationalProjection.projectCarrierPerformanceForAdmin(s))
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch carrier performance' }, { status: 500 });
    }
}
