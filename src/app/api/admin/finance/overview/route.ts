import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getFinanceOverview } from '@/services/admin/finance/overview';

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);

        const url = new URL(req.url);
        const from = url.searchParams.get('from') || undefined;
        const to = url.searchParams.get('to') || undefined;

        const data = await getFinanceOverview(from, to);
        return NextResponse.json({ ok: true, data });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
