import prisma from '@/lib/prisma';
import { transitionEscrowState } from './escrowStateMachine';
import { releaseEscrowFunds } from './escrowLedger';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';

export async function scheduleRelease(escrowHoldId: string) {
    const hold = await prisma.networkEscrowHold.findUnique({ where: { id: escrowHoldId } });
    if (!hold || hold.status !== 'DELIVERY_CONFIRMED') return null;

    // Simulate Trust Score release policy dynamically
    const trustScore = 80; // Typically fetch from TrustEngine via sellerTenantId
    let delayToApply = hold.releaseDelayHours; // By default 48h

    if (trustScore > 90) {
        delayToApply = 0; // Instant
    } else if (trustScore > 50) {
        delayToApply = 24; // 24h
    }

    const triggerAt = new Date();
    triggerAt.setHours(triggerAt.getHours() + delayToApply);

    // If it's 0 delay, execute immediately!
    if (delayToApply === 0) {
        return executeRelease(escrowHoldId);
    }

    // Otherwise, we log scheduling and use backbone dispatcher.
    await prisma.networkEscrowLifecycleEvent.create({
        data: {
            escrowHoldId,
            eventType: 'ESCROW_RELEASE_SCHEDULED',
            newState: 'DELIVERY_CONFIRMED',
            source: 'RELEASE_ENGINE',
            metadata: { scheduledAt: triggerAt, delay: delayToApply }
        }
    });

    await JobDispatcher.dispatchDelayedJob({
        jobType: 'EXECUTE_ESCROW_RELEASE',
        payload: { escrowHoldId },
        scheduledFor: triggerAt,
        tenantId: hold.sellerTenantId,
        idempotencyKey: `ESCROW_REL_${escrowHoldId}`
    });

    return hold;
}

export async function executeRelease(escrowHoldId: string) {
    const hold = await prisma.networkEscrowHold.findUnique({ where: { id: escrowHoldId } });
    if (!hold || hold.status === 'RELEASED') return hold; // Idempotent block

    if (hold.status === 'DISPUTED') {
        throw new Error('Cannot release disputed escrow');
    }

    await releaseEscrowFunds(
        hold.sellerTenantId,
        hold.buyerTenantId,
        hold.orderId,
        hold.amount
    );

    const releasedHold = await transitionEscrowState(
        hold.id, 'RELEASED', 'ESCROW_RELEASED', { source: 'SYSTEM' }
    );

    await prisma.networkEscrowHold.update({
        where: { id: hold.id },
        data: { releasedAt: new Date() }
    });

    return releasedHold;
}

export async function evaluateEscrowRelease(escrowHoldId: string) {
    // Manually push evaluation checking (For Cron / Worker usage)
    const hold = await prisma.networkEscrowHold.findUnique({
        where: { id: escrowHoldId }
    });

    if (hold?.status !== 'DELIVERY_CONFIRMED') return;
    return scheduleRelease(escrowHoldId);
}
