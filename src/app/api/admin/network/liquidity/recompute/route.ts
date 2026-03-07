import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const { target = 'ALL' } = await req.json().catch(() => ({}));

        const jobType = target === 'SUPPLY' ? 'SCAN_LIQUIDITY_SUPPLY' :
            target === 'DEMAND' ? 'SCAN_LIQUIDITY_DEMAND' :
                'GENERATE_LIQUIDITY_MATCHES';

        const idempotencyKey = `LIQ_RECOMPUTE_${target}_${Date.now()}`;

        const job = await JobDispatcher.dispatchJob({
            jobType,
            payload: { manualTrigger: true, target },
            idempotencyKey
        });

        // Also trigger the other sides if ALL
        if (target === 'ALL') {
            await JobDispatcher.dispatchJob({ jobType: 'SCAN_LIQUIDITY_SUPPLY', payload: { manualTrigger: true } });
            await JobDispatcher.dispatchJob({ jobType: 'SCAN_LIQUIDITY_DEMAND', payload: { manualTrigger: true } });
            // The match generation will run already, or we can delay it
        }

        return NextResponse.json({ success: true, accepted: true, jobId: job.id, status: 'scheduled' }, { status: 202 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to dispatch recompute job' }, { status: 500 });
    }
}
