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
    const ledgerBoostRaw = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: {
            tenantId: 'PLATFORM',
            direction: 'CREDIT',
            accountType: 'BOOST_REVENUE', 
            createdAt: { gte: start, lt: end }
        }
    });
    const takeRevenueCommission = Number(ledgerCommRaw._sum.amount || 0);
    const takeRevenueBoost = Number(ledgerBoostRaw._sum.amount || 0); 
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

    // Boost Impressions
    const boostImpRaw = await prisma.boostUsageDaily.aggregate({
         _sum: { sponsoredImpressions: true },
         where: { sellerTenantId: tenantId, day: dayStr }
    });
    const boostImpressions = boostImpRaw._sum.sponsoredImpressions || 0;

    // Boost Spend (Invoices issued today)
    const boostInvoicesRaw = await prisma.boostInvoice.aggregate({
         _sum: { amount: true },
         where: { sellerTenantId: tenantId, issuedAt: { gte: start, lt: end } }
    });
    const boostSpend = Number(boostInvoicesRaw._sum.amount || 0);

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
        boostImpressions,
        boostSpend
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

        // 1.b Compute cohort metrics
        const cohortTagsRaw = await prisma.pilotCohortTag.findMany({
             where: { tenantId: { in: Array.from(uniqueTenants) } }
        });
        const tenantToCohorts = new Map<string, string[]>();
        for (const ct of cohortTagsRaw) {
              if (!tenantToCohorts.has(ct.tenantId)) tenantToCohorts.set(ct.tenantId, []);
              tenantToCohorts.get(ct.tenantId)!.push(ct.tag);
        }

        // Aggregate by cohort
        const cohortDataMap = new Map<string, { gmvGross: number; orderCount: number; payoutVolume: number; takeRevenueCommission: number; chargebackAmount: number }>();
        
        for (const tidData of tenantsData) {
             const cohorts = tenantToCohorts.get(tidData.tenantId) || [];
             for (const tag of cohorts) {
                  if (!cohortDataMap.has(tag)) {
                       cohortDataMap.set(tag, { gmvGross: 0, orderCount: 0, payoutVolume: 0, takeRevenueCommission: 0, chargebackAmount: 0 });
                  }
                  const st = cohortDataMap.get(tag)!;
                  if (tidData.role === 'BUYER' || tidData.role === 'BOTH') {
                       st.gmvGross += Number(tidData.gmvGross);
                       st.orderCount += tidData.orderCount;
                  }
                  if (tidData.role === 'SELLER' || tidData.role === 'BOTH') {
                       st.payoutVolume += Number(tidData.payoutReceived);
                       st.takeRevenueCommission += Number(tidData.commissionPaid);
                  }
                  st.chargebackAmount += 0; // Derived chargebacks not fully per-tenant mapped in payload here easily without big query, fallback to 0 for pilot scope mostly 
             }
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

                for (const [tag, stats] of cohortDataMap.entries()) {
                     await tx.platformCohortDailyMetrics.upsert({
                         where: { day_cohortTag: { day, cohortTag: tag } },
                         update: { ...stats },
                         create: { day, cohortTag: tag, ...stats }
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
