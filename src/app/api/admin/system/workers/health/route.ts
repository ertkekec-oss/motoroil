import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { WorkerHeartbeatService } from '@/services/jobs/workerHeartbeat';

export async function GET(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const workers = await WorkerHeartbeatService.listWorkerHealth();
        return NextResponse.json(workers);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'System access only' }, { status: 403 });
    }

    try {
        await WorkerHeartbeatService.detectZombieWorkers();
        return NextResponse.json({ success: true, message: 'Zombie purge executed.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
