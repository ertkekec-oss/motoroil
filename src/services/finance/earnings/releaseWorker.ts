import { prisma } from '@/lib/prisma';
import { releaseSingleEarning } from './releaseSingle';
import { AlreadyRunningError } from './errors';
import { EarningStatus } from '@prisma/client';

export interface ReleaseCycleMetrics {
    attempted: number;
    released: number;
    skipped: number;
    alreadyRunning: number;
    failed: number;
}

export async function runEarningReleaseCycle(options: {
    now?: Date,
    batchSize?: number
}): Promise<ReleaseCycleMetrics> {
    const defaultNow = new Date();
    const effectiveNow = options.now ?? defaultNow;
    const batchSize = options.batchSize ?? 50;

    let metrics: ReleaseCycleMetrics = {
        attempted: 0,
        released: 0,
        skipped: 0,
        alreadyRunning: 0,
        failed: 0
    };

    let hasMore = true;
    let skipCount = 0; // standard cursor/offset for simple iteration

    // Loop through eligible earnings in batches
    while (hasMore) {
        // Query eligible earnings
        const eligibleEarnings = await prisma.sellerEarning.findMany({
            where: {
                status: { in: [EarningStatus.PENDING, EarningStatus.CLEARED] },
                expectedClearDate: { lte: effectiveNow }, // <= now
                archivedAt: null
            },
            take: batchSize,
            skip: skipCount,
            orderBy: { expectedClearDate: 'asc' }
        });

        if (eligibleEarnings.length === 0) {
            hasMore = false;
            break;
        }

        for (const earning of eligibleEarnings) {
            metrics.attempted++;
            try {
                await releaseSingleEarning(earning.id);
                metrics.released++;
            } catch (error: any) {
                if (error instanceof AlreadyRunningError) {
                    metrics.alreadyRunning++;
                } else if (error.name === 'ValidationError' || error.name === 'EscrowUnavailableError') {
                    // Safe logic checks that skipped the record for valid business reasons
                    console.warn(`[EarningWorker] Skipped earning ${earning.id}: ${error.message}`);
                    metrics.skipped++;
                } else {
                    console.error(`[EarningWorker] Failed releasing ${earning.id}`, error);
                    metrics.failed++;
                }
            }
        }

        // Technically if we process them successfully they will fall out of the `findMany` scope on next query.
        // But if some failed / skipped they remain in scope. Offset handles not getting stuck infinitely.
        skipCount += batchSize;

        // Failsafe for runaways
        if (skipCount > 5000) break;
    }

    return metrics;
}
