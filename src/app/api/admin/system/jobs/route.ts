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
        const jobs = await prisma.systemJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                queueName: true,
                jobType: true,
                status: true,
                priority: true,
                moduleScope: true,
                scheduledFor: true,
                createdAt: true,
                retryCount: true
            }
        });

        return NextResponse.json(jobs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
