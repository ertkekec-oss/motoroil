import { NextRequest } from 'next/server';
import { marketplaceQueue, marketplaceDlq } from '@/lib/queue';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketplace/queue/status
 * Returns marketplace queue statistics, forensic DLQ data, and recent audits
 */
export async function GET(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);

        const role = (ctx.role || "").toUpperCase();
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return apiError({ message: 'Unauthorized', status: 403, code: 'FORBIDDEN' }, ctx.requestId);
        }

        const url = new URL(req.url);
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

        return apiResponse({
            version: 'v2',
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
        }, { requestId: ctx.requestId });

    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

