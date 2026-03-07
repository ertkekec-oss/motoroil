import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { listShipmentsForTenant } from '@/services/shipping/core/shipmentService';
import { projectShipmentForTenant } from '@/services/shipping/projection/tenantShipmentProjection';

export async function GET(request: NextRequest) {
    const user: any = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const carrier = searchParams.get('carrier');

    const filters: any = {};
    if (status) filters.status = status;
    if (carrier) filters.carrierCode = carrier;

    try {
        const shipments = await listShipmentsForTenant(user.companyId, filters);
        return NextResponse.json({ data: shipments.map(projectShipmentForTenant) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
