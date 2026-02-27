import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runBoostBillingHealthSnapshot() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Calculate Overdue Invoice Count
    const overdueCount = await prisma.boostInvoice.count({
        where: { collectionStatus: 'OVERDUE' }
    });

    // 2. Total Outstanding AR (ISSUED in general)
    const outstandingInvoices = await prisma.boostInvoice.aggregate({
        _sum: { amount: true },
        where: { status: 'ISSUED' }
    });
    
    // Note: To be completely Ledger-Truthful, we'd query the AR ledger account. 
    // Here we query the invoice model for simple analytics speed, but for absolute 
    // financial reporting we could sum ledger accounts.
    const totalOutstandingAR = outstandingInvoices._sum.amount?.toNumber() || 0;

    // 3. Blocked Subscription Count
    const blockedSubCount = await prisma.boostSubscription.count({
        where: { billingBlocked: true }
    });

    // Insert or update health snapshot
    const snapshot = await prisma.billingHealthSnapshot.upsert({
        where: { day: today },
        update: {
            totalOutstandingAR,
            overdueInvoiceCount: overdueCount,
            blockedSubscriptionCount: blockedSubCount
        },
        create: {
            day: today,
            totalOutstandingAR,
            overdueInvoiceCount: overdueCount,
            blockedSubscriptionCount: blockedSubCount
        }
    });

    return snapshot;
}
