import { NextRequest, NextResponse } from 'next/server';
import { runBoostSubscriptionRolloverCycle } from '../../../../../services/billing/boost/rollover';
import { requirePlatformFinanceAdmin } from '../../../../../lib/auth/financeGuard';

export async function POST(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin(req);
        const results = await runBoostSubscriptionRolloverCycle('API_ADMIN_MANUAL_RUN');
        return NextResponse.json({ success: true, results });
    } catch(e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
