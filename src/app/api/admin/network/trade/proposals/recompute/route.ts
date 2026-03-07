import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const idempotencyKey = `PROP_GEN_MANUAL_${Date.now()}`;

        const job = await JobDispatcher.dispatchJob({
            jobType: 'GENERATE_TRADE_PROPOSALS',
            payload: { manualTrigger: true },
            idempotencyKey
        });

        return NextResponse.json({ success: true, accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to dispatch proposal generation job' }, { status: 500 });
    }
}
