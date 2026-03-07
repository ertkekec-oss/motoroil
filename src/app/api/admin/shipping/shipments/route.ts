import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectShipmentForAdmin } from '@/services/shipping/projection/adminShipmentProjection';

export async function GET(request: NextRequest) {
    const user: any = await getSession();
    // Simulate real admin role check here

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const carrierCode = searchParams.get('carrier');
    const tenantId = searchParams.get('tenantId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (status) where.status = status;
    if (carrierCode) where.carrierCode = carrierCode;
    if (tenantId) where.tenantId = tenantId;

    try {
        const shipments = await prisma.networkShipment.findMany({
            where,
            take: limit + 1,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            include: { packages: true },
            orderBy: { createdAt: 'desc' }
        });

        let nextCursor = null;
        if (shipments.length > limit) {
            const nextItem = shipments.pop();
            nextCursor = nextItem?.id;
        }

        return NextResponse.json({
            data: shipments.map(projectShipmentForAdmin),
            meta: { nextCursor }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
