import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function getFinanceOverview(from?: string, to?: string) {
    const whereClause: any = {};
    if (from || to) {
        whereClause.createdAt = {};
        if (from) whereClause.createdAt.gte = new Date(from);
        if (to) whereClause.createdAt.lte = new Date(to);
    }

    // Since ledger entries hold amounts, we can sum them up
    // Note: Escrow, Payable, Receivable sum logic depends on Debit vs Credit.
    // For simplicity of API returns, we might just sum raw decimal fields based on transaction types and sides if needed,
    // or return balances for accounts. However, ledger balances are point-in-time, while $queryRaw can sum entries over the period.

    const metrics = await prisma.ledgerEntry.groupBy({
        by: ['accountType'],
        where: whereClause,
        _sum: {
            amount: true
        }
    });

    // We can also compute cross-tenant aggregated balances natively or map them
    const structuredMetrics: Record<string, number> = {};

    // Default zero
    const accounts = [
        'PLATFORM_REVENUE_COMMISSION',
        'ESCROW_LIABILITY',
        'SHIPPING_EXPENSE',
        'SELLER_PAYABLE',
        'SELLER_CHARGEBACK_RECEIVABLE'
    ];
    accounts.forEach(acc => structuredMetrics[acc] = 0);

    metrics.forEach(m => {
        if (accounts.includes(m.accountType)) {
            structuredMetrics[m.accountType] = Number(m._sum.amount?.toString() || '0');
        }
    });

    const totalGMV = await prisma.networkOrder.aggregate({
        where: whereClause.createdAt ? { createdAt: whereClause.createdAt } : {},
        _sum: {
            totalAmount: true
        }
    });

    return {
        totalGMV: Number(totalGMV._sum.totalAmount?.toString() || '0'),
        commissionRevenue: structuredMetrics['PLATFORM_REVENUE_COMMISSION'],
        escrowLiability: structuredMetrics['ESCROW_LIABILITY'],
        shippingExpense: structuredMetrics['SHIPPING_EXPENSE'],
        sellerPayableTotal: structuredMetrics['SELLER_PAYABLE'],
        receivablesTotal: structuredMetrics['SELLER_CHARGEBACK_RECEIVABLE']
    };
}
