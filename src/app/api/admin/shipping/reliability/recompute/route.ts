import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const { tenantId } = await req.json();

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        const job = await JobDispatcher.dispatchJob({
            jobType: 'RECOMPUTE_SHIPPING_RELIABILITY',
            payload: { tenantId },
            tenantId: tenantId,
            idempotencyKey: `SHIP_REL_${tenantId}`
        });

        return NextResponse.json({ success: true, accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to recompute shipping reliability' }, { status: 500 });
    }
}
