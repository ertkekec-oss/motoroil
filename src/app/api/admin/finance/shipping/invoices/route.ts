import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getShippingInvoices } from '@/services/admin/finance/shippingQueue';

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);

        const url = new URL(req.url);
        const status = url.searchParams.get('status') || undefined;
        const cursor = url.searchParams.get('cursor') || undefined;

        const result = await getShippingInvoices(status, cursor);
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
