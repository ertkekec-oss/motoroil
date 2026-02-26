import { PrismaClient } from '@prisma/client';
import { finalizePayoutLedger } from '../finance/payout/ledgerFinalize';

const prisma = new PrismaClient();

export async function rerunOutboxForPayout(params: { adminUserId: string; providerPayoutId: string }) {
    const { adminUserId, providerPayoutId } = params;

    const payout = await prisma.providerPayout.findUnique({ where: { providerPayoutId } });
    if (!payout) throw new Error('Payout not found');

    const outbox = await prisma.payoutOutbox.findUnique({ where: { idempotencyKey: payout.idempotencyKey } });
    if (!outbox) throw new Error('Outbox record not found');

    if (outbox.status === 'SENT' || outbox.status === 'SENDING') {
         // force reset SENDING to PENDING safely
    }

    const reset = await prisma.payoutOutbox.update({
        where: { id: outbox.id },
        data: {
             status: 'PENDING',
             nextRetryAt: new Date(),
             attemptCount: 0 // starting over
        }
    });

    await prisma.financeOpsLog.create({
        data: {
            action: 'OUTBOX_RERUN',
            entityType: 'PayoutOutbox',
            entityId: outbox.id,
            severity: 'WARNING',
            payloadJson: { adminUserId, previousStatus: outbox.status }
        }
    });

    return { success: true, reset };
}

export async function forceReconcilePayout(params: { adminUserId: string; providerPayoutId: string }) {
    const { adminUserId, providerPayoutId } = params;

    const payout = await prisma.providerPayout.findUnique({ where: { providerPayoutId } });
    if (!payout) throw new Error('Payout not found');

    if (payout.status === 'SUCCEEDED') return { success: true, message: 'Already SUCCEEDED' };

    await prisma.providerPayout.update({
        where: { id: payout.id },
        data: { status: 'RECONCILE_REQUIRED' }
    });

    await prisma.financeOpsLog.create({
        data: {
            action: 'PAYOUT_FORCE_RECONCILE',
            entityType: 'ProviderPayout',
            entityId: payout.id,
            severity: 'WARNING',
            payloadJson: { adminUserId, previousStatus: payout.status }
        }
    });

    return { success: true };
}

export async function forceFinalizeSucceededPayout(params: { adminUserId: string; providerPayoutId: string }) {
    const { adminUserId, providerPayoutId } = params;

    const payout = await prisma.providerPayout.findUnique({ where: { providerPayoutId } });
    if (!payout) throw new Error('Payout not found');
    if (payout.status !== 'SUCCEEDED') throw new Error('Cannot finalize, not SUCCEEDED');

    await prisma.financeOpsLog.create({
        data: {
            action: 'PAYOUT_FORCE_FINALIZE_START',
            entityType: 'ProviderPayout',
            entityId: payout.id,
            severity: 'INFO',
            payloadJson: { adminUserId }
        }
    });

    const finalizeRes = await finalizePayoutLedger({ providerPayoutId });

    await prisma.financeOpsLog.create({
        data: {
            action: 'PAYOUT_FORCE_FINALIZE_END',
            entityType: 'ProviderPayout',
            entityId: payout.id,
            severity: 'INFO',
            payloadJson: { adminUserId, result: finalizeRes }
        }
    });

    return { success: true, finalizeRes };
}

export async function quarantinePayout(params: { adminUserId: string; providerPayoutId: string; reason: string }) {
    const { adminUserId, providerPayoutId, reason } = params;

    const payout = await prisma.providerPayout.findUnique({ where: { providerPayoutId } });
    if (!payout) throw new Error('Payout not found');

    await prisma.$transaction(async (tx) => {
        await tx.providerPayout.update({
             where: { id: payout.id },
             data: { status: 'QUARANTINED' }
        });

        // Also stop outbox if pending/sending
        const outbox = await tx.payoutOutbox.findUnique({ where: { idempotencyKey: payout.idempotencyKey } });
        if (outbox && (outbox.status === 'PENDING' || outbox.status === 'SENDING')) {
             await tx.payoutOutbox.update({
                  where: { id: outbox.id },
                  data: { status: 'FAILED' }
             });
        }
    });

    await prisma.financeOpsLog.create({
        data: {
            action: 'PAYOUT_QUARANTINED',
            entityType: 'ProviderPayout',
            entityId: payout.id,
            severity: 'CRITICAL',
            payloadJson: { adminUserId, reason }
        }
    });

    return { success: true };
}
