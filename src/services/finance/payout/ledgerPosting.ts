import { Prisma } from '@prisma/client';

export async function createPayoutLedgerEntries(
    tx: Prisma.TransactionClient,
    params: {
        sellerTenantId: string;
        ledgerAccountId: string;
        amount: Prisma.Decimal;
        currency: string;
        idempotencyKey: string;
        refId: string;
    }
) {
    // 1. Ledger Group
    const group = await tx.ledgerGroup.create({
        data: {
            idempotencyKey: params.idempotencyKey,
            tenantId: params.sellerTenantId,
            type: 'PAYOUT_INTERNAL',
            description: `Internal Payout ${params.refId}`
        }
    });

    // 2. Entries A: Reserve Funds
    await tx.ledgerEntry.create({
        data: {
            tenantId: params.sellerTenantId,
            ledgerAccountId: params.ledgerAccountId,
            groupId: group.id,
            accountType: 'SELLER_WALLET_AVAILABLE',
            direction: 'DEBIT',
            amount: params.amount,
            currency: params.currency,
            refType: 'PAYOUT_REQUEST',
            referenceId: params.refId
        }
    });

    await tx.ledgerEntry.create({
        data: {
            tenantId: params.sellerTenantId,
            ledgerAccountId: params.ledgerAccountId,
            groupId: group.id,
            accountType: 'SELLER_WALLET_RESERVED',
            direction: 'CREDIT',
            amount: params.amount,
            currency: params.currency,
            refType: 'PAYOUT_REQUEST',
            referenceId: params.refId
        }
    });

    // 3. Entries B: Complete Payment (Internal)
    await tx.ledgerEntry.create({
        data: {
            tenantId: params.sellerTenantId,
            ledgerAccountId: params.ledgerAccountId,
            groupId: group.id,
            accountType: 'SELLER_WALLET_RESERVED',
            direction: 'DEBIT',
            amount: params.amount,
            currency: params.currency,
            refType: 'PAYOUT_REQUEST',
            referenceId: params.refId
        }
    });

    await tx.ledgerEntry.create({
        data: {
            tenantId: params.sellerTenantId,
            ledgerAccountId: params.ledgerAccountId,
            groupId: group.id,
            accountType: 'SELLER_PAYOUT_OUT',
            direction: 'CREDIT',
            amount: params.amount,
            currency: params.currency,
            refType: 'PAYOUT_REQUEST',
            referenceId: params.refId
        }
    });

    // 4. Update LedgerAccount balance explicitly
    // Net reserved = +amount - amount = 0, so we only decrement available.
    await tx.ledgerAccount.update({
        where: { id: params.ledgerAccountId },
        data: {
            availableBalance: { decrement: params.amount }
        }
    });

    return group;
}
