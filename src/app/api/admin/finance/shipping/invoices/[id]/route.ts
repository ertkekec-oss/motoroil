import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getShippingInvoiceById } from '@/services/admin/finance/shippingQueue';

export async function GET(req: NextRequest, context: any) {
    const params = await context.params;
    try {
        await requirePlatformFinanceAdmin(req);

        const invoice = await getShippingInvoiceById(params.id);
        if (!invoice) {
            return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ ok: true, data: invoice });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
