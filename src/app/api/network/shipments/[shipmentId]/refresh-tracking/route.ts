import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { refreshTracking } from '@/services/shipping/core/trackingService';
import { getShipmentDetails } from '@/services/shipping/core/shipmentService';

export async function POST(request: NextRequest, props: { params: Promise<{ shipmentId: string }> }) {
    const params = await props.params;
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await getShipmentDetails(user.companyId, params.shipmentId);
        await refreshTracking(params.shipmentId);
        return NextResponse.json({ success: true, message: 'Tracking refreshed successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
