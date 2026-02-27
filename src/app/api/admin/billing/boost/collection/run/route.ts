import { NextResponse } from 'next/server';
import { requirePlatformFinanceAdmin } from '@/lib/auth';
import { runBoostCollectionGuard } from '@/services/billing/boost/collectionGuard';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const uOpts = await requirePlatformFinanceAdmin();
        const res = await runBoostCollectionGuard(uOpts.user.id);
        return NextResponse.json(res);
    } catch(e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
