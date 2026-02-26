import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { manualMatchShippingLine } from '@/services/admin/finance/shippingMutations';

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const adminUser = await requirePlatformFinanceAdmin(req);

        const body = await req.json();
        if (!body.shipmentId) {
            return NextResponse.json({ ok: false, error: 'shipmentId is required' }, { status: 400 });
        }

        const result = await manualMatchShippingLine(adminUser.id, params.lineId, body.shipmentId);
        return NextResponse.json({ ok: true, data: result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        if (e.message.includes('not found') || e.message.includes('Cannot manually match')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error: ' + e.message }, { status: 500 });
    }
}
