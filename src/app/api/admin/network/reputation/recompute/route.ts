import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role, userId } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { tenantId } = body;

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required for recompute' }, { status: 400 });
        }

        const job = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_REPUTATION_SCORE',
            payload: { tenantId },
            tenantId,
            idempotencyKey: `REP_RECOMP_${tenantId}`
        });

        return NextResponse.json({ success: true, accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
