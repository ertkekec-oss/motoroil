import { PrismaClient, RecalcReason } from '@prisma/client';
import { aggregateSellerSignals } from './signals';
import { computeSellerScore } from './scoring';
import { withIdempotency } from '../../../lib/idempotency';

const prisma = new PrismaClient();

export async function submitTrustScoreRecalc(sellerTenantId: string, reason: RecalcReason) {
    const todayStr = new Date().toISOString().split('T')[0];
    const idempotencyKey = `TRUST_RECALC:${sellerTenantId}:${todayStr}`;

    return withIdempotency(
        prisma,
        idempotencyKey,
        'TRUST_SCORE',
        sellerTenantId,
        async (tx: any) => {
            // Register Recalc Job
            const job = await tx.trustScoreRecalcJob.create({
                data: {
                    sellerTenantId,
                    reason,
                    idempotencyKey,
                    status: 'RUNNING'
                }
            });

            try {
                // Execute Recalc 
                const windowEnd = new Date();
                const windowStart = new Date();
                windowStart.setDate(windowStart.getDate() - 90); // 90 days rolling window

                const signals = await aggregateSellerSignals(sellerTenantId, windowStart, windowEnd);
                const scoreResult = computeSellerScore(signals);

                // Upsert Score Update
                await tx.sellerTrustScore.upsert({
                    where: { sellerTenantId },
                    create: {
                        sellerTenantId,
                        score: scoreResult.finalScore,
                        tier: scoreResult.tier,
                        componentsJson: scoreResult as any,
                        windowStart,
                        windowEnd
                    },
                    update: {
                        score: scoreResult.finalScore,
                        tier: scoreResult.tier,
                        componentsJson: scoreResult as any,
                        windowStart,
                        windowEnd,
                        computedAt: new Date(),
                        version: { increment: 1 }
                    }
                });

                // Mark Job Succeeded
                return await tx.trustScoreRecalcJob.update({
                    where: { id: job.id },
                    data: { status: 'SUCCEEDED', completedAt: new Date() }
                });

            } catch (error: any) {
                await tx.trustScoreRecalcJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', errorText: error.message }
                });
                throw error;
            }
        }
    );
}

// Scheduled Cron Worker
// Could be invoked hourly or daily by a CRON infrastructure or Next.js background fetch
export async function runTrustScoreRecalcCycle(batchSize: number = 100) {
    // Basic logic mapping all unique seller tenants having activity
    const activeSellers = await prisma.company.findMany({
        where: { type: 'SELLER' },
        select: { id: true },
        take: batchSize
    });

    for (const seller of activeSellers) {
        try {
            await submitTrustScoreRecalc(seller.id, 'SCHEDULED');
        } catch (e: any) {
            if (e.message !== 'ALREADY_SUCCEEDED') {
                console.error(`Recalc failed for ${seller.id}`, e);
            }
        }
    }
}
