import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isFinanceOrGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' ||
        role === 'PLATFORM_GROWTH_ADMIN' ||
        role === 'PLATFORM_FINANCE_ADMIN' ||
        role === 'PLATFORM_ADMIN' ||
        tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isFinanceOrGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const bucket = searchParams.get('bucket') || 'all';

        // This simulates a live AR Aging query by checking BoostInvoices
        // Real implementation might join with sub/tenant data
        // For simplicity, we mock real logic by aggregating existing invoices

        let whereCondition: any = {
            status: 'ISSUED', // Unpaid
        };

        if (bucket === 'current') whereCondition.collectionStatus = 'CURRENT';
        if (bucket === 'grace') whereCondition.collectionStatus = 'GRACE';
        if (bucket === 'overdue') whereCondition.collectionStatus = 'OVERDUE';
        if (bucket === 'blocked') whereCondition.collectionStatus = 'COLLECTION_BLOCKED';

        const openInvoices = await prisma.boostInvoice.findMany({
            where: whereCondition,
            include: { subscription: true },
            orderBy: { dueDate: 'asc' }
        });

        let outstandingArTotal = 0;
        let currentCount = 0;
        let graceCount = 0;
        let overdueCount = 0;
        let blockedSubscriptionsCount = 0;

        const allOpen = await prisma.boostInvoice.groupBy({
            by: ['collectionStatus'],
            where: { status: 'ISSUED' },
            _sum: { amountDue: true },
            _count: { id: true }
        });

        allOpen.forEach(group => {
            const sum = Number(group._sum.amountDue || 0);
            outstandingArTotal += sum;
            if (group.collectionStatus === 'CURRENT') currentCount += group._count.id;
            if (group.collectionStatus === 'GRACE') graceCount += group._count.id;
            if (group.collectionStatus === 'OVERDUE') overdueCount += group._count.id;
            if (group.collectionStatus === 'COLLECTION_BLOCKED') blockedSubscriptionsCount += group._count.id;
        });

        // Compute aging buckets
        const aging = [
            { bucket: "0-7", amount: 0, count: 0 },
            { bucket: "7-14", amount: 0, count: 0 },
            { bucket: "14-30", amount: 0, count: 0 },
            { bucket: "30+", amount: 0, count: 0 }
        ];

        const now = new Date();
        openInvoices.forEach(inv => {
            const daysOverdue = inv.dueDate ? (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24) : 0;
            const amt = Number(inv.amountDue);
            if (daysOverdue <= 7) { aging[0].amount += amt; aging[0].count++; }
            else if (daysOverdue <= 14) { aging[1].amount += amt; aging[1].count++; }
            else if (daysOverdue <= 30) { aging[2].amount += amt; aging[2].count++; }
            else { aging[3].amount += amt; aging[3].count++; }
        });

        const tenants = openInvoices.map(inv => ({
            tenantId: inv.subscription.tenantId,
            overdueSince: inv.dueDate,
            amount: Number(inv.amountDue),
            subscriptionId: inv.subscription.id,
            invoiceId: inv.id,
            status: inv.collectionStatus,
            billingBlocked: inv.subscription.billingBlocked
        }));

        const kpis = { outstandingArTotal, currentCount, graceCount, overdueCount, blockedSubscriptionsCount };

        // Return pagination standard format
        return NextResponse.json({
            kpis,
            aging,
            tenants,
            nextCursor: null
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
