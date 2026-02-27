import { PrismaClient, BoostInvoiceCollectionStatus, BoostSubscriptionStatus } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';

const prisma = new PrismaClient();

export async function runBoostCollectionGuard(
    adminUserId: string = 'SYSTEM_GUARD',
    graceDays: number = 5,
    invoiceIdFilter?: string
) {
    const now = new Date();

    const graceWhereClause: any = {
        status: 'ISSUED',
        collectionStatus: 'CURRENT',
        dueAt: { lt: now }
    };
    if (invoiceIdFilter) graceWhereClause.id = invoiceIdFilter;

    // 1. Find ISSUED invoices that should enter GRACE period
    const toGrace = await prisma.boostInvoice.findMany({
        where: graceWhereClause
    });

    for (const inv of toGrace) {
        const idempotencyKey = `COLLECTION_GUARD_GRACE:${inv.id}`;
        try {
            await withIdempotency(prisma, idempotencyKey, 'BOOST_COLLECTION_GUARD', 'PLATFORM', async (tx) => {
                const graceEndsAt = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);
                
                await tx.boostInvoice.update({
                    where: { id: inv.id },
                    data: {
                        collectionStatus: 'GRACE',
                        graceEndsAt
                    }
                });

                await tx.financeOpsLog.create({
                    data: {
                        action: 'BOOST_INVOICE_GRACE_STARTED',
                        entityType: 'BoostInvoice',
                        entityId: inv.id,
                        severity: 'WARNING',
                        payloadJson: { adminUserId, graceEndsAt }
                    }
                });
            });
        } catch (e: any) {
            if (e.message !== 'ALREADY_SUCCEEDED') console.error(e);
        }
    }

    const overdueWhereClause: any = {
        status: 'ISSUED',
        collectionStatus: 'GRACE',
        graceEndsAt: { lt: now }
    };
    if (invoiceIdFilter) overdueWhereClause.id = invoiceIdFilter;

    // 2. Find GRACE invoices that should enter OVERDUE and BLOCK subscription
    const toOverdue = await prisma.boostInvoice.findMany({
        where: overdueWhereClause,
        include: { subscription: true }
    });

    for (const inv of toOverdue) {
        const idempotencyKey = `COLLECTION_GUARD_OVERDUE:${inv.id}`;
        try {
            await withIdempotency(prisma, idempotencyKey, 'BOOST_COLLECTION_GUARD', 'PLATFORM', async (tx) => {
                // Mark Invoice Overdue
                await tx.boostInvoice.update({
                    where: { id: inv.id },
                    data: {
                        collectionStatus: 'OVERDUE',
                        overdueAt: now
                    }
                });

                await tx.financeOpsLog.create({
                    data: {
                        action: 'BOOST_INVOICE_OVERDUE',
                        entityType: 'BoostInvoice',
                        entityId: inv.id,
                        severity: 'CRITICAL',
                        payloadJson: { adminUserId, overdueAt: now }
                    }
                });

                // Block Subscription if not already blocked
                if (!inv.subscription.billingBlocked) {
                    await tx.boostSubscription.update({
                        where: { id: inv.subscription.id },
                        data: {
                            billingBlocked: true,
                            status: 'PAUSED',
                            blockedAt: now
                        }
                    });

                    // Set policy flag
                    const policyExists = await tx.tenantRolloutPolicy.findUnique({
                        where: { tenantId: inv.sellerTenantId }
                    });

                    if (policyExists) {
                        await tx.tenantRolloutPolicy.update({
                            where: { tenantId: inv.sellerTenantId },
                            data: { boostPaused: true }
                        });
                    } else {
                        await tx.tenantRolloutPolicy.create({
                            data: {
                                tenantId: inv.sellerTenantId,
                                boostPaused: true,
                                payoutPaused: false,
                                escrowPaused: false
                            }
                        });
                    }

                    await tx.financeOpsLog.create({
                        data: {
                            action: 'BOOST_SUBSCRIPTION_BLOCKED_FOR_NONPAYMENT',
                            entityType: 'BoostSubscription',
                            entityId: inv.subscription.id,
                            severity: 'CRITICAL',
                            payloadJson: { adminUserId, invoiceId: inv.id }
                        }
                    });
                }
            });
        } catch (e: any) {
            if (e.message !== 'ALREADY_SUCCEEDED') console.error(e);
        }
    }

    return {
        gracedCount: toGrace.length,
        overdueCount: toOverdue.length,
        timestamp: now
    };
}
