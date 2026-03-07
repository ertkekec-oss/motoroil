import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { JobDeadLetter } from '@/services/jobs/jobDeadLetter';

export async function GET(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const deadLetters = await JobDeadLetter.listDeadLetters();
        return NextResponse.json(deadLetters);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { deadLetterId } = body;

        if (!deadLetterId) return NextResponse.json({ error: 'deadLetterId required' }, { status: 400 });

        const requeuedJob = await JobDeadLetter.requeueDeadLetter(deadLetterId);

        return NextResponse.json({ success: true, newJobId: requeuedJob.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
