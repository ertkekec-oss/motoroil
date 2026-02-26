import { PrismaClient } from '@prisma/client';
import { MockProvider } from '../providers/mockProvider';

const prisma = new PrismaClient();
const provider = new MockProvider(); // Should inject dynamically for prod

export async function runPayoutOutboxCycle(params: {
    batchSize?: number;
    now?: Date;
}) {
    const { batchSize = 10, now = new Date() } = params;

    const outboxes = await prisma.payoutOutbox.findMany({
        where: {
            status: { in: ['PENDING', 'FAILED'] },
            OR: [
                { nextRetryAt: null },
                { nextRetryAt: { lte: now } }
            ],
            attemptCount: { lt: 5 }
        },
        take: batchSize,
        orderBy: { createdAt: 'asc' }
    });

    let processedCount = 0;
    for (const outbox of outboxes) {
        // Lock optimistic
        const locked = await prisma.payoutOutbox.updateMany({
            where: { id: outbox.id, status: outbox.status },
            data: { status: 'SENDING', attemptCount: { increment: 1 } }
        });

        if (locked.count === 0) continue; // Someone else picked it

        const payload: any = outbox.payloadJson;

        try {
            const resp = await provider.createSplitPayout({
                providerPayoutId: payload.providerPayoutId,
                subMerchantKey: payload.subMerchantKey,
                netAmount: Number(payload.netAmount),
                commissionAmount: Number(payload.commissionAmount),
                currency: 'TRY'
            });

            if (resp.success) {
                await prisma.$transaction(async tx => {
                    await tx.payoutOutbox.update({
                        where: { id: outbox.id },
                        data: { status: 'SENT' }
                    });

                    await tx.providerPayout.update({
                        where: { providerPayoutId: payload.providerPayoutId },
                        data: { status: 'SENT' }
                    });
                });
            } else {
                throw new Error(resp.error || 'Unknown provider error');
            }
        } catch (e: any) {
            // Calculate next backoff
            const newAttemptCount = outbox.attemptCount + 1;
            const nextRetry = new Date(now.getTime() + Math.pow(2, newAttemptCount) * 60000);

            await prisma.payoutOutbox.update({
                where: { id: outbox.id },
                data: {
                    status: 'FAILED',
                    lastError: e.message || 'Error occurred',
                    nextRetryAt: nextRetry
                }
            });
        }
        processedCount++;
    }

    return { processedCount };
}
