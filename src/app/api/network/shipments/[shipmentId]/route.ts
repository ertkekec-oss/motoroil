import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getShipmentDetails } from '@/services/shipping/core/shipmentService';
import { projectShipmentForTenant } from '@/services/shipping/projection/tenantShipmentProjection';

export async function GET(request: NextRequest, { params }: { params: { shipmentId: string } }) {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const shipment = await getShipmentDetails(user.companyId, params.shipmentId);
        return NextResponse.json({ data: projectShipmentForTenant(shipment) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}
