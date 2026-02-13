import { NextResponse } from 'next/server';
import { marketplaceQueue, marketplaceDlq } from '@/lib/queue';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/marketplace/queue/status
 * Returns marketplace queue statistics, forensic DLQ data, and recent audits
 */
export async function GET(request: Request) {
    const rid = uuidv4();
    const serverTime = new Date().toISOString();

    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const role = (auth.user.role || "").toUpperCase();
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: 'Unauthorized', rid }, { status: 403 });
        }

        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const mplace = url.searchParams.get('marketplace');
        const status = url.searchParams.get('status');

        const [waiting, active, completed, failed, delayed, dlqCount, audits] = await Promise.all([
            marketplaceQueue.getWaitingCount(),
            marketplaceQueue.getActiveCount(),
            marketplaceQueue.getCompletedCount(),
            marketplaceQueue.getFailedCount(),
            marketplaceQueue.getDelayedCount(),
            marketplaceDlq.getJobs(['waiting', 'active', 'failed', 'completed', 'delayed']).then(j => j.length),
            (prisma as any).marketplaceActionAudit.findMany({
                where: {
                    ...(mplace ? { marketplace: mplace } : {}),
                    ...(status ? { status: status } : {}),
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: skip
            })
        ]);

        // Get last 10 dead jobs for forensics
        const deadJobs = await marketplaceDlq.getJobs(['waiting', 'active', 'failed', 'completed', 'delayed'], 0, 9);
        const forensics = deadJobs.map(j => ({
            id: j.id,
            action: j.data?.input?.actionKey,
            marketplace: j.data?.input?.marketplace,
            errorCode: j.data?.error?.errorCode,
            errorMessage: j.data?.error?.message,
            failedAt: j.data?.failedAt,
            attempts: j.data?.attemptsMade,
            input: j.data?.input
        }));

        return NextResponse.json({
            version: 'v2',
            rid,
            serverTime,
            status: 'READY',
            counts: {
                waiting,
                active,
                completed,
                failed,
                delayed,
                dlq: dlqCount
            },
            forensics,
            audits
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'ERROR',
            message: error.message,
            rid,
            serverTime
        }, { status: 500 });
    }
}
