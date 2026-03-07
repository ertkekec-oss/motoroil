import { getRequestContext } from '@/lib/api-context';
import { NextRequest, NextResponse } from 'next/server';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';
export async function POST(request: NextRequest) {
    const { role } = await getRequestContext(request);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const { actionType, categoryId, regionCode, tenantId } = body;

    if (actionType === 'RECOMPUTE_MARKET_SIGNALS') {
        const job = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_MARKET_SIGNALS',
            payload: { categoryId, regionCode },
            idempotencyKey: `MKT_SIGNALS_${categoryId || 'GLB'}_${regionCode || 'GLB'}`
        });
        return NextResponse.json({ accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    }

    if (actionType === 'GENERATE_TENANT_MARKET_INSIGHTS') {
        if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        const job = await JobDispatcher.dispatchJob({
            jobType: 'GENERATE_TENANT_MARKET_INSIGHTS',
            payload: { tenantId },
            tenantId,
            idempotencyKey: `MKT_T_INSIGHTS_${tenantId}`
        });
        return NextResponse.json({ accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    }

    return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
}
