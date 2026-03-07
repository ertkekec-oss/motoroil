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

        if (!body.jobType) return NextResponse.json({ error: 'jobType required' }, { status: 400 });

        const input: any = {
            jobType: body.jobType,
            payload: body.payload || {},
            tenantId: body.tenantId,
            idempotencyKey: body.idempotencyKey,
            priority: body.priority
        };

        let result;
        if (body.scheduledFor) {
            input.scheduledFor = new Date(body.scheduledFor);
            result = await JobDispatcher.dispatchDelayedJob(input);
        } else {
            result = await JobDispatcher.dispatchJob(input);
        }

        return NextResponse.json({ success: true, jobId: result.id, status: result.status });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
