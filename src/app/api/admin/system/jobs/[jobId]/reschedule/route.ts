import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/jobs\/([^\/]+)\/reschedule$/);
        const jobId = urlMatch ? urlMatch[1] : null;

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

        const body = await req.json();
        if (!body.scheduledFor) return NextResponse.json({ error: 'scheduledFor required' }, { status: 400 });

        await JobDispatcher.rescheduleJob(jobId, new Date(body.scheduledFor));

        return NextResponse.json({ success: true, message: `Job ${jobId} rescheduled to ${body.scheduledFor}.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
