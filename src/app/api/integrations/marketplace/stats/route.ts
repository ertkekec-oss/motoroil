import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });
        if (!company) return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });
        const companyId = company.id;

        // 1. Last Sync Stats
        const configs = await prisma.marketplaceConfig.findMany({
            where: { companyId }
        });

        // 2. Order Counts (Last 24h & 30d)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [orders24h, orders30d] = await Promise.all([
            prisma.order.count({ where: { companyId, createdAt: { gte: last24h } } }),
            prisma.order.count({ where: { companyId, createdAt: { gte: last30d } } })
        ]);

        // 3. Receivable Balance (120.03)
        // Find the account first to be safe
        const account = await prisma.account.findFirst({
            where: { companyId, code: '120.03' }
        });

        // Sum debits - credits for 120.03
        const balanceResult: any = await prisma.$queryRaw`
            SELECT SUM(debit - credit) as balance 
            FROM "JournalEntryLine" 
            WHERE "companyId" = ${companyId} AND "accountCode" = '120.03'
        `;
        const openBalance = Number(balanceResult[0]?.balance || 0);

        // 4. Suspense / Pending Transactions
        const pendingSettlements = await prisma.marketplaceTransactionLedger.count({
            where: { companyId, processingStatus: 'PENDING' }
        });

        const totalSettledAmount: any = await prisma.$queryRaw`
            SELECT SUM(amount) as total 
            FROM "MarketplaceTransactionLedger" 
            WHERE "companyId" = ${companyId} AND "processingStatus" = 'MATCHED'
        `;

        return NextResponse.json({
            success: true,
            stats: {
                configs: configs.map(c => ({
                    type: c.type,
                    lastSync: c.lastSync,
                    isActive: c.isActive
                })),
                orders: {
                    last24h: orders24h,
                    last30d: orders30d
                },
                financials: {
                    openReceivables: openBalance,
                    pendingSettlements
                }
            }
        });

    } catch (error: any) {
        console.error('Marketplace Stats Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
