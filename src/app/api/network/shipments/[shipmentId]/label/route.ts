import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { requestShipmentLabel } from '@/services/shipping/core/labelService';
import { getShipmentDetails } from '@/services/shipping/core/shipmentService';

export async function POST(request: NextRequest, props: { params: Promise<{ shipmentId: string }> }) {
    const params = await props.params;
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    try {
        // Enforce tenant authorization implicitly by attempting to get the shipment first
        await getShipmentDetails(user.companyId, params.shipmentId);

        const labelData = await requestShipmentLabel(params.shipmentId, body);
        return NextResponse.json({ data: labelData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
