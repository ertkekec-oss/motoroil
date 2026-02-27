import { PrismaClient } from '@prisma/client';
import { isFeatureEnabled } from '../../rollout/featureFlags';

const prisma = new PrismaClient();

export async function createOrActivateBoostSubscription(params: {
    adminUserId: string;
    sellerTenantId: string;
    planCode: string;
}) {
    const { adminUserId, sellerTenantId, planCode } = params;

    const isEnabled = await isFeatureEnabled({ tenantId: sellerTenantId, key: 'BOOST_ENABLED' });
    if (!isEnabled) throw new Error('BOOST_ENABLED is not active for this tenant');

    const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId: sellerTenantId } });
    if (policy?.boostPaused) throw new Error('Boost functionality is currently paused for this tenant');

    const plan = await prisma.boostPlan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive) throw new Error('Invalid or inactive plan');

    // Due to prisma not supporting complex partial unique indexes easily across standard drivers, we lock in a tx
    return prisma.$transaction(async (tx) => {
        // Find existing ACTIVE
        const existing = await tx.boostSubscription.findFirst({
             where: { sellerTenantId, status: 'ACTIVE' }
        });

        if (existing) {
             throw new Error('Tenant already has an active boost subscription');
        }

        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

        const sub = await tx.boostSubscription.create({
             data: {
                  sellerTenantId,
                  planId: plan.id,
                  status: 'ACTIVE',
                  startAt: now,
                  currentPeriodStart: now,
                  currentPeriodEnd: nextMonth
             }
        });

        await tx.financeOpsLog.create({
             data: {
                  action: 'BOOST_SUBSCRIPTION_ACTIVATED',
                  entityType: 'BoostSubscription',
                  entityId: sub.id,
                  severity: 'INFO',
                  payloadJson: { adminUserId, planCode, sellerTenantId, startAt: sub.startAt }
             }
        });

        return sub;
    });
}

export async function pauseBoostSubscription(params: {
    adminUserId: string;
    sellerTenantId: string;
    reason: string;
}) {
    const { adminUserId, sellerTenantId, reason } = params;

    return prisma.$transaction(async (tx) => {
        const sub = await tx.boostSubscription.findFirst({
             where: { sellerTenantId, status: 'ACTIVE' }
        });

        if (!sub) throw new Error('No active subscription found to pause');

        const updated = await tx.boostSubscription.update({
             where: { id: sub.id },
             data: { status: 'PAUSED', pausedAt: new Date() }
        });

        await tx.tenantRolloutPolicy.update({
             where: { tenantId: sellerTenantId },
             data: { boostPaused: true }
        });

        await tx.financeOpsLog.create({
             data: {
                  action: 'BOOST_SUBSCRIPTION_PAUSED',
                  entityType: 'BoostSubscription',
                  entityId: sub.id,
                  severity: 'WARNING',
                  payloadJson: { adminUserId, reason, sellerTenantId }
             }
        });

        return updated;
    });
}

export async function cancelBoostSubscription(params: {
     adminUserId: string;
     sellerTenantId: string;
     reason: string;
}) {
    const { adminUserId, sellerTenantId, reason } = params;

    return prisma.$transaction(async (tx) => {
         const sub = await tx.boostSubscription.findFirst({
              where: { sellerTenantId, status: { in: ['ACTIVE', 'PAUSED'] } }
         });
 
         if (!sub) throw new Error('No cancellable subscription found');
 
         const updated = await tx.boostSubscription.update({
              where: { id: sub.id },
              data: { status: 'CANCELED', canceledAt: new Date(), autoRenew: false }
         });

         await tx.financeOpsLog.create({
            data: {
                 action: 'BOOST_SUBSCRIPTION_CANCELED',
                 entityType: 'BoostSubscription',
                 entityId: sub.id,
                 severity: 'WARNING',
                 payloadJson: { adminUserId, reason, sellerTenantId }
            }
         });
 
         return updated;
    });
}

export async function getActiveBoostSubscription(sellerTenantId: string) {
    const sub = await prisma.boostSubscription.findFirst({
         where: { sellerTenantId, status: 'ACTIVE', billingBlocked: false },
         include: { plan: true }
    });

    if (!sub) return null;

    const overdueInvoice = await prisma.boostInvoice.findFirst({
         where: { sellerTenantId, collectionStatus: 'OVERDUE' }
    });

    if (overdueInvoice) return null;

    const periodKey = `${sub.currentPeriodStart.getUTCFullYear()}-${String(sub.currentPeriodStart.getUTCMonth()+1).padStart(2,'0')}`;
    
    // Calculate usage
    const usages = await prisma.boostUsageDaily.findMany({
         where: { sellerTenantId, periodKey, day: { gte: sub.currentPeriodStart.toISOString().split('T')[0] } }
    });

    let usedThisPeriod = 0;
    for (const u of usages) usedThisPeriod += u.sponsoredImpressions;

    const remaining = Math.max(0, sub.plan.monthlyImpressionQuota - usedThisPeriod);

    return {
         ...sub,
         usedThisPeriod,
         remaining
    };
}
