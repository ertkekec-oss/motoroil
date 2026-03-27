import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

export async function createReconciliation(params: {
    tenantId: string;
    accountId: string; // Customer ID
    periodStart: Date;
    periodEnd: Date;
}) {
    // 1) Fetch Items for the period
    const transactions = await prisma.transaction.findMany({
        where: {
            customerId: params.accountId,
            date: { gte: params.periodStart, lte: params.periodEnd },
            companyId: params.tenantId,
            deletedAt: null
        },
        orderBy: { date: 'asc' }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const items = transactions.map(tx => {
        const debitTypes = ['Sales', 'Invoice', 'Adjustment', 'ALACAK'];
        const creditTypes = ['Tahsilat', 'Payment', 'Refund', 'BORÇ'];
        
        const debit = debitTypes.includes(tx.type) ? Number(tx.amount) : 0; 
        const credit = creditTypes.includes(tx.type) ? Number(tx.amount) : 0;

        totalDebit += debit;
        totalCredit += credit;

        return {
            transactionId: tx.id,
            date: tx.date,
            description: tx.description || tx.type,
            debit,
            credit
        };
    });

    const balance = totalDebit - totalCredit;

    // 2) Generate Content Hash for Snapshot
    const hashPayload = {
        accountId: params.accountId,
        periodStart: params.periodStart.toISOString(),
        periodEnd: params.periodEnd.toISOString(),
        totalDebit,
        totalCredit,
        balance,
        itemsCount: items.length
    };

    const hashSha256 = crypto.createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex');

    // 3) Create Reconciliation Record + Snapshot + Items in transaction
    const recon = await prisma.$transaction(async (tx) => {
        const reconciliation = await tx.reconciliation.create({
            data: {
                tenantId: params.tenantId,
                accountId: params.accountId,
                periodStart: params.periodStart,
                periodEnd: params.periodEnd,
                balance,
                currency: "TRY"
            }
        });

        await tx.reconciliationSnapshot.create({
            data: {
                reconciliationId: reconciliation.id,
                totalDebit,
                totalCredit,
                balance,
                transactionCount: items.length,
                hashSha256
            }
        });

        if (items.length > 0) {
            await tx.reconciliationItem.createMany({
                data: items.map(i => ({
                    reconciliationId: reconciliation.id,
                    ...i
                }))
            });
        }

        return reconciliation;
    });

    return recon;
}

export async function linkReconciliationToContract(reconciliationId: string, contractId: string) {
    return prisma.reconciliation.update({
        where: { id: reconciliationId },
        data: { linkedContractId: contractId }
    });
}
