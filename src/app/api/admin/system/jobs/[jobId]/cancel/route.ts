import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/jobs\/([^\/]+)\/cancel$/);
        const jobId = urlMatch ? urlMatch[1] : null;

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

        await JobDispatcher.cancelJob(jobId);

        return NextResponse.json({ success: true, message: `Job ${jobId} canceled safely.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
