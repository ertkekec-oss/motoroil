import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createDraftShipment, attachShipmentItems } from '@/services/shipping/core/shipmentService';

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { carrierCode, shipmentDirection, shipmentType, totalPackages, items } = body;

    try {
        const shipment = await createDraftShipment({
            tenantId: user.companyId,
            orderId: params.orderId,
            sellerTenantId: user.companyId, // Mock assumption for now
            carrierCode,
            shipmentDirection,
            shipmentType,
            totalPackages
        });

        if (items && Array.isArray(items)) {
            await attachShipmentItems(shipment.id, items);
        }

        return NextResponse.json({ data: shipment });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
