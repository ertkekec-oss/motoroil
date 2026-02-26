import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runStuckPayoutRepair(params: { now?: Date } = {}) {
    const now = params.now || new Date();
    let correctedCount = 0;

    // A) Outbox SENDING but older than 15m
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
    const stuckOutboxes = await prisma.payoutOutbox.findMany({
        where: {
            status: 'SENDING',
            updatedAt: { lt: fifteenMinsAgo }
        }
    });

    for (const ob of stuckOutboxes) {
        await prisma.payoutOutbox.update({
            where: { id: ob.id },
            data: {
                status: 'PENDING',
                attemptCount: { increment: 1 },
                nextRetryAt: now
            }
        });
        
        await prisma.financeOpsLog.create({
            data: {
                action: 'STUCK_OUTBOX_RESET',
                entityType: 'PayoutOutbox',
                entityId: ob.id,
                severity: 'WARNING',
                payloadJson: { previousStatus: 'SENDING' }
            }
        });
        correctedCount++;
    }

    // B) ProviderPayout QUEUED but no Outbox
    // (In reality this is a drift check, assuming outbox gets created in same tx, but maybe tx failed partially or outbox deleted)
    const queuedPayouts = await prisma.providerPayout.findMany({
        where: { status: 'QUEUED' }
    });
    
    for (const payout of queuedPayouts) {
        const ob = await prisma.payoutOutbox.findUnique({
            where: { idempotencyKey: payout.idempotencyKey }
        });
        if (!ob) {
            await prisma.financeIntegrityAlert.create({
                data: {
                    type: 'OUTBOX_MISSING',
                    referenceId: payout.id,
                    severity: 'CRITICAL',
                    detailsJson: { idempotencyKey: payout.idempotencyKey }
                }
            });
            correctedCount++;
        }
    }

    // C) ProviderPayout SENT but no webhook for >24h -> move to RECONCILE_REQUIRED
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60000);
    const silentPayouts = await prisma.providerPayout.findMany({
        where: {
            status: 'SENT',
            updatedAt: { lt: twentyFourHoursAgo }
        }
    });

    for (const payout of silentPayouts) {
         await prisma.providerPayout.update({
             where: { id: payout.id },
             data: { status: 'RECONCILE_REQUIRED' }
         });

         await prisma.financeOpsLog.create({
             data: {
                 action: 'RECONCILE_REQUIRED_MARK',
                 entityType: 'ProviderPayout',
                 entityId: payout.id,
                 severity: 'WARNING',
                 payloadJson: { previousStatus: 'SENT' }
             }
         });
         correctedCount++;
    }

    return { success: true, correctedCount };
}
