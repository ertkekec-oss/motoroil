import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { projectShipmentForAdmin } from '@/services/shipping/projection/adminShipmentProjection';

export async function GET(request: NextRequest, { params }: { params: { shipmentId: string } }) {
    const user = await getSession();

    try {
        const shipment = await prisma.networkShipment.findUnique({
            where: { id: params.shipmentId },
            include: {
                packages: true,
                items: true,
                trackingEvents: { orderBy: { eventTime: 'desc' } },
                labelRequests: { orderBy: { requestedAt: 'asc' } }
            }
        });

        if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ data: projectShipmentForAdmin(shipment) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
