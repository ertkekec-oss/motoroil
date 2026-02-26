import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { disputeShippingLine } from '@/services/admin/finance/shippingMutations';

export async function POST(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        const adminUser = await requirePlatformFinanceAdmin(req);

        const body = await req.json();
        if (!body.reasonCode) {
            return NextResponse.json({ ok: false, error: 'reasonCode is required' }, { status: 400 });
        }

        const result = await disputeShippingLine(adminUser.id, params.lineId, body.reasonCode, body.note);
        return NextResponse.json({ ok: true, data: result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        if (e.message.includes('not found')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error: ' + e.message }, { status: 500 });
    }
}
