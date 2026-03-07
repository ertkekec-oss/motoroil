import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { buyerTenantId } = body;

        if (!buyerTenantId) {
            return NextResponse.json({ error: 'buyerTenantId is required for recompute' }, { status: 400 });
        }

        const job = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_TRADE_RISK',
            payload: { buyerTenantId },
            tenantId: buyerTenantId,
            idempotencyKey: `TRADE_RISK_${buyerTenantId}`
        });

        return NextResponse.json({ success: true, accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
