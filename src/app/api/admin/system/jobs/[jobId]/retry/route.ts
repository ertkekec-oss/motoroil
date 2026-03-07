import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/jobs\/([^\/]+)\/retry$/);
        const jobId = urlMatch ? urlMatch[1] : null;

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

        const job = await prisma.systemJob.findUnique({ where: { id: jobId } });
        if (!job || job.status === 'SUCCEEDED' || job.status === 'RUNNING') {
            return NextResponse.json({ error: 'Job is not eligible for manual retry.' }, { status: 400 });
        }

        await prisma.systemJob.update({
            where: { id: jobId },
            data: { status: 'PENDING', retryCount: 0, failedAt: null, lastErrorCode: null, updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, message: `Job ${jobId} forced retry scheduled.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
