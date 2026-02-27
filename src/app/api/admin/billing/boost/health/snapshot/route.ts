import { NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/lib/auth';
import { runBoostBillingHealthSnapshot } from '@/services/billing/boost/health';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await requirePlatformFinanceAdmin();
        const res = await runBoostBillingHealthSnapshot();
        return NextResponse.json(res);
    } catch(e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
