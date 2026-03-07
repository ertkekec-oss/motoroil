import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { WorkerHeartbeatService } from '@/services/jobs/workerHeartbeat';

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    // Ideally restricted to INTERNAL or specific service account
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'System proxy access only' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { workerName, queueName } = body;

        if (!workerName || !queueName) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        await WorkerHeartbeatService.recordWorkerHeartbeat(workerName, queueName);

        return NextResponse.json({ success: true, timestamp: Date.now() });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
