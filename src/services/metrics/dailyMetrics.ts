import { PrismaClient } from '@prisma/client';
import { withIdempotency } from '../../lib/idempotency';

const prisma = new PrismaClient();

export function computeDayRange(dayStr: string, tz: string = 'Europe/Istanbul') {
    // Turkey is fixed at UTC+3
    const start = new Date(`${dayStr}T00:00:00+03:00`);
    const end = new Date(`${dayStr}T00:00:00+03:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
}

export async function computePlatformDailyMetrics(dayStr: string) {
    const { start, end } = computeDayRange(dayStr);

    const payments = await prisma.providerPayment.findMany({
        where: {
            status: 'PAID',
            createdAt: { gte: start, lt: end }
        },
        select: { amount: true, tenantId: true, networkPaymentId: true }
    });

    const gmvGross = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const uniqueOrders = new Set(payments.map(p => p.networkPaymentId));
    const activeBuyers = new Set(payments.map(p => p.tenantId));

    const payouts = await prisma.providerPayout.findMany({
        where: {
            status: 'SUCCEEDED',
            updatedAt: { gte: start, lt: end }
        },
        select: { netAmount: true, commissionAmount: true, sellerTenantId: true, createdAt: true, updatedAt: true }
    });

    const payoutVolume = payouts.reduce((acc, p) => acc + Number(p.netAmount), 0);
    const payoutCount = payouts.length;
    const activeSellers = new Set(payouts.map(p => p.sellerTenantId));

    const ledgerCommRaw = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: {
            tenantId: 'PLATFORM',
            direction: 'CREDIT',
            accountType: 'PLATFORM_REVENUE', 
            createdAt: { gte: start, lt: end }
        }
    });
    const takeRevenueCommission = Number(ledgerCommRaw._sum.amount || 0);
    const takeRevenueBoost = 0; 
    const takeRate = gmvGross > 0 ? takeRevenueCommission / gmvGross : 0;

    let totalReleaseHours = 0;
    let relCount = 0;
    for (const po of payouts) {
        const ms = po.updatedAt.getTime() - po.createdAt.getTime();
        totalReleaseHours += ms / (1000 * 60 * 60);
        relCount++;
    }
    const avgReleaseTimeHours = relCount > 0 ? totalReleaseHours / relCount : 0;

    const escrowCredits = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { accountType: 'ESCROW_LIABILITY', direction: 'CREDIT', createdAt: { lt: end } }
    });
    const escrowDebits = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { accountType: 'ESCROW_LIABILITY', direction: 'DEBIT', createdAt: { lt: end } }
    });
    const escrowFloatEndOfDay = Number(escrowCredits._sum.amount || 0) - Number(escrowDebits._sum.amount || 0);

    const cbEvents = await prisma.providerWebhookEvent.findMany({
        where: { eventType: 'CHARGEBACK', receivedAt: { gte: start, lt: end } }
    });
    const chargebackCount = cbEvents.length;
    let chargebackAmount = 0;
    for (const cb of cbEvents) {
        const py = cb.payloadJson as any;
        if (py && py.amount) chargebackAmount += Number(py.amount);
    }

    const recEodRaw = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { accountType: 'SELLER_CHARGEBACK_RECEIVABLE', direction: 'DEBIT', createdAt: { lt: end } }
    });
    const recEodCreditsRaw = await prisma.ledgerEntry.aggregate({
         _sum: { amount: true },
         where: { accountType: 'SELLER_CHARGEBACK_RECEIVABLE', direction: 'CREDIT', createdAt: { lt: end } }
    });
    const receivableOutstandingEndOfDay = Number(recEodRaw._sum.amount || 0) - Number(recEodCreditsRaw._sum.amount || 0);

    const opsAlerts = await prisma.financeIntegrityAlert.count({
        where: { severity: 'CRITICAL', createdAt: { gte: start, lt: end } }
    });

    return {
        day: dayStr,
        gmvGross,
        orderCount: uniqueOrders.size,
        activeBuyerCount: activeBuyers.size,
        activeSellerCount: activeSellers.size,
        takeRevenueCommission,
        takeRevenueBoost,
        takeRate,
        escrowFloatEndOfDay,
        payoutVolume,
        payoutCount,
        avgReleaseTimeHours,
        chargebackAmount,
        chargebackCount,
        receivableOutstandingEndOfDay,
        opsCriticalAlertCount: opsAlerts
    };
}

export async function computeTenantDailyMetrics(dayStr: string, tenantId: string) {
    const { start, end } = computeDayRange(dayStr);

    const buyerPayments = await prisma.providerPayment.findMany({
        where: { tenantId, status: 'PAID', createdAt: { gte: start, lt: end } },
        select: { amount: true, networkPaymentId: true }
    });

    const isBuyer = buyerPayments.length > 0;
    let gmvGross = 0;
    let orderCount = 0;

    if (isBuyer) {
        gmvGross = buyerPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        orderCount = new Set(buyerPayments.map(p => p.networkPaymentId)).size;
    }

    const sellerPayouts = await prisma.providerPayout.findMany({
        where: { sellerTenantId: tenantId, status: 'SUCCEEDED', updatedAt: { gte: start, lt: end } }
    });

    const isSeller = sellerPayouts.length > 0;
    let commissionPaid = 0;
    let payoutReceived = 0;
    let avgReleaseTimeHours = 0;

    if (isSeller) {
        let totalReleaseHours = 0;
        let count = 0;
        for (const po of sellerPayouts) {
            commissionPaid += Number(po.commissionAmount);
            payoutReceived += Number(po.netAmount);
            const ms = po.updatedAt.getTime() - po.createdAt.getTime();
            totalReleaseHours += ms / (1000 * 60 * 60);
            count++;
        }
        avgReleaseTimeHours = count > 0 ? totalReleaseHours / count : 0;

        gmvGross = sellerPayouts.reduce((acc, p) => acc + Number(p.grossAmount), 0);
    }

    // Default Dispute/Impression fallbacks
    const disputeCount = 0; 
    const chargebackCount = 0;
    const discoveryImpressions = 0; 

    // Receivables
    const recEodRaw = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { tenantId, accountType: 'SELLER_CHARGEBACK_RECEIVABLE', direction: 'DEBIT', createdAt: { lt: end } }
    });
    const recEodCreditsRaw = await prisma.ledgerEntry.aggregate({
         _sum: { amount: true },
         where: { tenantId, accountType: 'SELLER_CHARGEBACK_RECEIVABLE', direction: 'CREDIT', createdAt: { lt: end } }
    });
    const receivableOutstanding = Number(recEodRaw._sum.amount || 0) - Number(recEodCreditsRaw._sum.amount || 0);

    let role: 'BUYER' | 'SELLER' | 'BOTH' = 'BUYER';
    if (isBuyer && isSeller) role = 'BOTH';
    else if (isSeller) role = 'SELLER';

    return {
        day: dayStr,
        tenantId,
        role,
        gmvGross,
        orderCount,
        commissionPaid,
        payoutReceived,
        avgReleaseTimeHours,
        disputeCount,
        chargebackCount,
        receivableOutstanding,
        discoveryImpressions,
        boostImpressions: 0
    };
}

export async function runDailyMetricsJob(params: { dayStr?: string, backfillDays?: number }) {
    const todayStr = params.dayStr || new Date().toISOString().split('T')[0];
    const backfill = params.backfillDays || 0;

    const daysToRun: string[] = [];
    if (backfill > 0) {
         const tDate = new Date(`${todayStr}T00:00:00Z`); // use generic to parse
         for (let i = backfill; i >= 0; i--) {
              const d = new Date(tDate.getTime() - i * 24 * 60 * 60 * 1000);
              daysToRun.push(d.toISOString().split('T')[0]);
         }
    } else {
         daysToRun.push(todayStr);
    }

    const results = [];

    for (const day of daysToRun) {
        
        // 1. Compute everything OUTSIDE transaction
        const platData = await computePlatformDailyMetrics(day);

        const { start, end } = computeDayRange(day);
        const activeBuyersRaw = await prisma.providerPayment.findMany({
             where: { status: 'PAID', createdAt: { gte: start, lt: end } },
             select: { tenantId: true }
        });
        const activeSellersRaw = await prisma.providerPayout.findMany({
             where: { status: 'SUCCEEDED', updatedAt: { gte: start, lt: end } },
             select: { sellerTenantId: true }
        });

        const uniqueTenants = new Set([
             ...activeBuyersRaw.map(b => b.tenantId),
             ...activeSellersRaw.map(s => s.sellerTenantId)
        ]);

        const tenantsData = [];
        for (const tenantId of uniqueTenants) {
             tenantsData.push(await computeTenantDailyMetrics(day, tenantId));
        }

        // 2. Commit inside idempotency transaction
        const idempotencyKey = `METRICS_DAILY:${day}`;
        try {
            const res = await withIdempotency(prisma, idempotencyKey, 'METRICS_JOB', 'SYSTEM', async (tx) => {
                await tx.platformDailyMetrics.upsert({
                    where: { day },
                    update: platData,
                    create: platData
                });

                for (const tidData of tenantsData) {
                     await tx.tenantDailyMetrics.upsert({
                         where: { day_tenantId: { day: tidData.day, tenantId: tidData.tenantId } },
                         update: tidData,
                         create: tidData
                     });
                }

                return { success: true, day, tenantsProcessed: uniqueTenants.size };
        }, (res) => res.day);
        
        results.push(res);
        } catch (e: any) {
             if (e.message === 'ALREADY_SUCCEEDED') {
                 results.push({ success: true, day, message: 'Already processed' });
             } else {
                 throw e;
             }
        }
    }

    return { processed: results };
}
