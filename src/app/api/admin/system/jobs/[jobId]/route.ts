import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { role } = await getRequestContext(req);
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const urlMatch = req.url.match(/jobs\/([^\/]+)$/);
        const jobId = urlMatch ? urlMatch[1] : null;

        if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

        const job = await prisma.systemJob.findUnique({
            where: { id: jobId },
            include: { executions: true } // Admin transparency projection requirement
        });

        // Omit raw explicit payload from casual debug view unless specifically unmasked.
        const safeMetadata = { ...job?.metadata as any };
        if (safeMetadata && safeMetadata.payload) {
            safeMetadata.payload = '[RESTRICTED_PAYLOAD_MASK - See Hash]';
        }

        return NextResponse.json({ ...job, metadata: safeMetadata });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
