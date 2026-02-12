
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const tenantId = session.tenantId;

        // Configuration
        const checkDays = 30;
        const refundThresholdMultiplier = 2.0; // 2x the average is suspicious
        const discountThresholdMultiplier = 2.0;

        const startDate = subDays(new Date(), checkDays);

        // 1. Fetch Staff Performance Data
        // We need transactions grouped by creator (staff).
        // However, Transaction model doesn't strictly have `createdById`. It has companyId.
        // But AuditLog has `userId`. 
        // Or specific `SalesInvoice`? SalesInvoice doesn't have `createdById` in schema shown earlier either!
        // Wait, schema (Step 2912) showed `SalesInvoice` has `companyId`, `customerId`. No `staffId`.
        // BUT `SuspendedSale` has no staff either.
        // `Transaction` has no staff.
        // `AuditLog` has `userId`.

        // So we MUST use `AuditLog` to detect who performed the action, OR assume the current user context is saved somewhere. 
        // If the system doesn't track `staffId` on Sales, we can't detect WHICH cashier did it unless we look at AuditLogs.

        // Let's look at `AuditLog`: `action: 'CREATE'`, `entity: 'SalesInvoice'`, `userId`.
        // This is a reliable way IF audit logs are active.
        // Or `Transaction` creation logs.

        // Alternative: The `User` model has `transactions`? No.
        // `Staff` model exists! `id`, `name`, `role`.
        // But `SalesInvoice` in schema doesn't link to `Staff`.

        // CHECK SCHEMA AGAIN: `SalesInvoice` relation to `User` or `Staff`?
        // Step 2912: `model SalesInvoice` (Line 421) -> `companyId`, `customerId`. No user/staff.

        // This is a limitation. I will look at `AuditLog` for "Invoice Creation" or "Refund".
        // `AuditLog` -> `userId`, `action`.

        // Strategy:
        // 1. Count 'REFUND' or 'CANCEL' or 'DELETE' actions in AuditLog per User.
        // 2. Calculate average count per active user.
        // 3. Find outliers.

        const auditLogs = await (prisma as any).auditLog.findMany({
            where: {
                tenantId: tenantId,
                createdAt: { gte: startDate },
                action: { in: ['REFUND', 'CANCEL_SALE', 'DELETE_ITEM', 'APPLY_DISCOUNT', 'VOID'] }
            },
            select: {
                userId: true,
                userName: true,
                action: true,
                details: true
            }
        });

        // Group by User
        const userStats: any = {};

        auditLogs.forEach((log: any) => {
            const uid = log.userId || 'unknown';
            if (!userStats[uid]) userStats[uid] = { name: log.userName || 'Unknown', actions: {} };

            if (!userStats[uid].actions[log.action]) userStats[uid].actions[log.action] = 0;
            userStats[uid].actions[log.action]++;
        });

        // Convert to Array for Analysis
        const users: any[] = Object.values(userStats);
        if (users.length === 0) return NextResponse.json({ anomalies: [] });

        const anomalies: any[] = [];

        // Analyzer: Refund/Cancel Rate
        // Calculate Mean
        const totalRefunds = users.reduce((sum: number, u: any) => sum + (Number(u.actions['REFUND']) || 0) + (Number(u.actions['CANCEL_SALE']) || 0), 0);
        const avgRefunds = totalRefunds / Math.max(1, users.length);

        users.forEach((u: any) => {
            const userRefunds = (Number(u.actions['REFUND']) || 0) + (Number(u.actions['CANCEL_SALE']) || 0);

            // Heuristic: Must have at least 3 refunds to be considered (noise filter), and > 2x average
            if (userRefunds > 3 && userRefunds > (avgRefunds * refundThresholdMultiplier)) {
                const percentHigher = Math.round(((userRefunds - avgRefunds) / avgRefunds) * 100);
                anomalies.push({
                    type: 'HIGH_RETURN_RATE',
                    severity: percentHigher > 100 ? 'HIGH' : 'MEDIUM',
                    staffName: u.name,
                    metric: `${userRefunds} İade/İptal`,
                    baseline: `${avgRefunds.toFixed(1)} Ort.`,
                    description: `Bu personel ortalamadan %${percentHigher} daha fazla iade/iptal işlemi yapmış. (${userRefunds} vs ${avgRefunds.toFixed(1)})`
                });
            }
        });

        // Analyzer: Voids (Item Deletion) BEFORE sale
        // If we track 'DELETE_ITEM' in audit logs (from POS)
        const totalVoids = users.reduce((sum: number, u: any) => sum + (Number(u.actions['DELETE_ITEM']) || 0), 0);
        const avgVoids = totalVoids / Math.max(1, users.length);

        users.forEach((u: any) => {
            const userVoids = u.actions['DELETE_ITEM'] || 0;
            if (userVoids > 5 && userVoids > (avgVoids * 2.5)) {
                anomalies.push({
                    type: 'HIGH_VOID_RATE',
                    severity: 'MEDIUM',
                    staffName: u.name,
                    metric: `${userVoids} Ürün Silme`,
                    baseline: `${avgVoids.toFixed(1)} Ort.`,
                    description: `Satış sırasında ürün silme oranı çok yüksek.`
                });
            }
        });

        return NextResponse.json({ anomalies });

    } catch (error: any) {
        console.error("Anomaly Detection Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
