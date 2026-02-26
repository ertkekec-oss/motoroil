import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getShippingLinesQueue } from '@/services/admin/finance/shippingQueue';

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);

        const url = new URL(req.url);
        // Default to statuses that require human intervention
        const statusFilter = url.searchParams.get('status') || 'UNMATCHED,MULTI_MATCH,OUT_OF_POLICY,DISPUTED';
        const cursor = url.searchParams.get('cursor') || undefined;

        const result = await getShippingLinesQueue(statusFilter, cursor);
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
