import { NextRequest } from 'next/server';
import { marketplaceQueue, marketplaceDlq } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/observability';
import { apiResponse, apiError } from '@/lib/api-context';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketplace/queue/health
 * Evaluates SLOs and returns system health status
 */


export async function GET(req: NextRequest) {
    try {
        // Security check via secret key
        const authKey = req.headers.get('x-health-key');
        if (process.env.NODE_ENV === 'production' && (!authKey || authKey !== process.env.HEALTHCHECK_KEY)) {
            return apiError({ message: 'Unauthorized', status: 401, code: 'UNAUTHORIZED' });
        }

        // Health endpoint is public (with key) to prevent domino effects when session lookups fail
        const now = new Date();

        const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // 1. Fetch Metrics in Parallel
        const [
            waitingCount,
            activeCount,
            recentAudits,
            recentAuthFailures,
            deadJobs
        ] = await Promise.all([
            marketplaceQueue.getWaitingCount(),
            marketplaceQueue.getActiveCount(),
            (prisma as any).marketplaceActionAudit.findMany({
                where: { createdAt: { gte: oneHourAgo } },
                select: { status: true }
            }),
            (prisma as any).marketplaceActionAudit.count({
                where: {
                    errorCode: 'E_PROVIDER_AUTH',
                    createdAt: { gte: tenMinsAgo }
                }
            }),
            marketplaceDlq.getJobs(['failed', 'completed'], 0, 50)
        ]);

        // 2. Calculate SLOs

        // Success Rate (Last Hour)
        const totalAudits = recentAudits.length;
        const successAudits = recentAudits.filter((a: any) => a.status === 'SUCCESS').length;
        const successRate = totalAudits > 0 ? (successAudits / totalAudits) * 100 : 100;

        // DLQ Rate (Jobs that entered DLQ recently)
        const recentDlqCount = deadJobs.filter((j: any) => {
            const failedAt = j.data?.failedAt ? new Date(j.data.failedAt) : null;
            return failedAt && failedAt >= tenMinsAgo;
        }).length;

        // Queue Backlog Risk
        const isBacklogHigh = waitingCount > 100 || activeCount > 20;

        // 3. Health Determination
        let health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
        const issues: string[] = [];

        if (successRate < 90) {
            health = 'DEGRADED';
            issues.push(`Success rate is low: ${successRate.toFixed(1)}% (Threshold: 90%)`);
        }
        if (recentAuthFailures > 0) {
            health = 'DEGRADED';
            issues.push(`Detected ${recentAuthFailures} authentication failures in last 10 mins.`);
        }
        if (recentDlqCount > 5) {
            health = 'CRITICAL';
            issues.push(`DLQ volume spike: ${recentDlqCount} jobs failed critically in 10 mins.`);
        }
        if (isBacklogHigh) {
            if (health !== 'CRITICAL') health = 'DEGRADED';
            issues.push(`Queue backlog detected: ${waitingCount} waiting, ${activeCount} active.`);
        }

        // Proactive Alerting if Critical
        if (health === 'CRITICAL') {
            logger.alert('Marketplace System Health CRITICAL', {
                alertType: 'EXTERNAL_FAILURE_RATE',
                status: health,
                error: issues.join(' | ')
            });
        }

        return apiResponse({
            status: health,
            timestamp: now.toISOString(),
            metrics: {
                successRate: successRate.toFixed(2) + '%',
                recentDlqCount,
                recentAuthFailures,
                waitingCount,
                activeCount
            },
            issues,
            slo: {
                successRateMin: 95,
                dlqMaxPer10Min: 5,
                authFailuresMax: 0
            }
        });

    } catch (error: any) {
        return apiError(error);
    }
}

