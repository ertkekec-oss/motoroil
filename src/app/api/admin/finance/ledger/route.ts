import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/services/admin/finance/guard';
import { getPlatformLedgerEntries } from '@/services/admin/finance/ledger';

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);

        const url = new URL(req.url);
        const from = url.searchParams.get('from') || undefined;
        const to = url.searchParams.get('to') || undefined;
        const account = url.searchParams.get('account') || undefined;
        const cursor = url.searchParams.get('cursor') || undefined;

        const result = await getPlatformLedgerEntries({ from, to, account, cursor });
        return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
        if (e.message.includes('UNAUTHORIZED') || e.message.includes('FORBIDDEN')) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 });
        }
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}
