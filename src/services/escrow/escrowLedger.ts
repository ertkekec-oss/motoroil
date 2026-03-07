import prisma from '@/lib/prisma';
import { NetworkEscrowTransactionType, NetworkEscrowTransactionStatus } from '@prisma/client';

export async function getOrCreateEscrowAccount(tenantId: string) {
    let account = await prisma.networkEscrowAccount.findUnique({
        where: { tenantId }
    });

    if (!account) {
        account = await prisma.networkEscrowAccount.create({
            data: { tenantId }
        });
    }
    return account;
}

export async function applyEscrowHold(tenantId: string, _orderId: string, amount: number) {
    // In a real system, we'd lock funds from available balance here or wait for DEPOSIT.
    // For escrow, funds enter the system, we put them directly into lock.
    const account = await getOrCreateEscrowAccount(tenantId);

    return prisma.$transaction(async (tx) => {
        // 1. Transaction Log (Buyer deposits and puts on hold)
        await tx.networkEscrowTransaction.create({
            data: {
                tenantId,
                orderId: _orderId,
                escrowId: account.id,
                transactionType: 'HOLD',
                amount,
                status: 'COMPLETED',
                metadata: { context: 'Initial Buyer Hold' },
                processedAt: new Date(),
            }
        });

        // 2. Increase Locked Balance
        return tx.networkEscrowAccount.update({
            where: { id: account.id },
            data: { lockedBalance: { increment: amount } }
        });
    });
}

export async function releaseEscrowFunds(sellerTenantId: string, buyerTenantId: string, orderId: string, amount: number) {
    // Escrow funds unlock from buyer and transfer to seller available
    const sellerAccount = await getOrCreateEscrowAccount(sellerTenantId);
    const buyerAccount = await getOrCreateEscrowAccount(buyerTenantId);

    return prisma.$transaction(async (tx) => {
        // Buyer side ledger adjustment
        await tx.networkEscrowTransaction.create({
            data: {
                tenantId: buyerTenantId,
                orderId,
                escrowId: buyerAccount.id,
                transactionType: 'RELEASE',
                amount: -amount,
                status: 'COMPLETED',
                metadata: { destination: sellerTenantId },
                processedAt: new Date()
            }
        });

        // Decrease buyer locked balance
        await tx.networkEscrowAccount.update({
            where: { id: buyerAccount.id },
            data: { lockedBalance: { decrement: amount } }
        });

        // Seller side ledger adjustment
        await tx.networkEscrowTransaction.create({
            data: {
                tenantId: sellerTenantId,
                orderId,
                escrowId: sellerAccount.id,
                transactionType: 'DEPOSIT',
                amount,
                status: 'COMPLETED',
                metadata: { origin: buyerTenantId, reason: 'Escrow Release' },
                processedAt: new Date()
            }
        });

        // Increase seller available balance
        return tx.networkEscrowAccount.update({
            where: { id: sellerAccount.id },
            data: { availableBalance: { increment: amount } }
        });
    });
}

export async function refundEscrowFunds(buyerTenantId: string, _sellerTenantId: string, orderId: string, amount: number) {
    const buyerAccount = await getOrCreateEscrowAccount(buyerTenantId);

    return prisma.$transaction(async (tx) => {
        await tx.networkEscrowTransaction.create({
            data: {
                tenantId: buyerTenantId,
                orderId,
                escrowId: buyerAccount.id,
                transactionType: 'REFUND',
                amount,
                status: 'COMPLETED',
                processedAt: new Date()
            }
        });

        // Funds move from Locked back to Buyer Available (or returned to card externally)
        return tx.networkEscrowAccount.update({
            where: { id: buyerAccount.id },
            data: {
                lockedBalance: { decrement: amount },
                availableBalance: { increment: amount }
            }
        });
    });
}
