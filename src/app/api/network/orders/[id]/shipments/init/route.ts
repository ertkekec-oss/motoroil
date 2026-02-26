import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initiateShipment } from '@/services/shipment/init';
import { z } from 'zod';

const shipmentInitSchema = z.object({
    carrierCode: z.string().min(1, 'Carrier code is required'),
    items: z.array(z.any()).optional()
});

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const session = await getSession();
        if (!session?.tenantId || !session?.settings?.companyId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized / No context' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = shipmentInitSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, errors: parsed.error.format() }, { status: 400 });
        }

        const { carrierCode, items } = parsed.data;

        const shipment = await initiateShipment({
            networkOrderId: params.id,
            sellerCompanyId: session.settings.companyId,
            carrierCode,
            items
        });

        return NextResponse.json({
            ok: true,
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            labelUrl: shipment.labelUrl,
            status: shipment.status
        }, { status: 201 });

    } catch (e: any) {
        console.error('Shipment Init Error:', e);
        const code = e.httpCode || 500;
        return NextResponse.json({ ok: false, error: e.message }, { status: code });
    }
}
