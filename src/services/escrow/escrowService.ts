import prisma from '@/lib/prisma';
import { transitionEscrowState } from './escrowStateMachine';
import { applyEscrowHold } from './escrowLedger';

export async function createEscrowHold(orderId: string, buyerTenantId: string, sellerTenantId: string, amount: number) {
    const existingHold = await prisma.networkEscrowHold.findUnique({
        where: { orderId }
    });
    if (existingHold) throw new Error('Escrow already created for this order');

    const amountNum = typeof amount === 'number' ? amount : parseFloat(amount);

    const escrowHold = await prisma.networkEscrowHold.create({
        data: {
            orderId,
            buyerTenantId,
            sellerTenantId,
            amount: amountNum,
            status: 'CREATED',
            releaseStrategy: 'DELIVERY_PLUS_DELAY', // Mock default
            releaseDelayHours: 48
        }
    });

    await prisma.networkEscrowLifecycleEvent.create({
        data: {
            escrowHoldId: escrowHold.id,
            eventType: 'ESCROW_CREATED',
            newState: 'CREATED',
            source: 'API'
        }
    });

    return escrowHold;
}

export async function captureEscrowFunds(orderId: string) {
    const hold = await prisma.networkEscrowHold.findUnique({ where: { orderId } });
    if (!hold) throw new Error('Escrow not found');
    if (hold.status !== 'CREATED' && hold.status !== 'FUNDS_HELD') {
        throw new Error(`Cannot capture funds for hold in status ${hold.status}`);
    }

    if (hold.status === 'FUNDS_HELD') {
        return hold; // Idempotent block
    }

    // Ledger block
    await applyEscrowHold(hold.buyerTenantId, hold.orderId, hold.amount);

    return transitionEscrowState(hold.id, 'FUNDS_HELD', 'FUNDS_CAPTURED', {
        source: 'PAYMENT_GATEWAY'
    });
}

export async function getEscrowDetails(orderId: string) {
    const hold = await prisma.networkEscrowHold.findUnique({
        where: { orderId },
        include: { lifecycleEvents: { orderBy: { createdAt: 'desc' } } }
    });
    if (!hold) throw new Error('Escrow not found');
    return hold;
}

export async function listEscrowsForTenant(tenantId: string) {
    return prisma.networkEscrowHold.findMany({
        where: {
            OR: [
                { buyerTenantId: tenantId },
                { sellerTenantId: tenantId }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
}
