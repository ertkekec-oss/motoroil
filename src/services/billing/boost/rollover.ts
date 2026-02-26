import { PrismaClient } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { ensureLedgerAccount } from '../../finance/shipping/postChargeback';

const prisma = new PrismaClient();

export async function runBoostSubscriptionRolloverCycle(
    adminUserId: string = 'SYSTEM_ROLLOVER',
    subscriptionIdParam?: string
) {
    const now = new Date();

    const whereClause: any = {
         status: 'ACTIVE',
         nextRenewalAt: { lte: now }
    };
    if (subscriptionIdParam) whereClause.id = subscriptionIdParam;

    // 1. Fetch active subs where nextRenewalAt <= now
    const subsToRenew = await prisma.boostSubscription.findMany({
        where: whereClause
    });

    const results = [];

    for (const sub of subsToRenew) {
         try {
             // We do each rollover idempotently
             const periodKeyParam = `${sub.currentPeriodEnd.getUTCFullYear()}-${String(sub.currentPeriodEnd.getUTCMonth()+1).padStart(2,'0')}`;
             const idempotencyKey = `ROLL_OVER:${sub.id}:${periodKeyParam}`;

             const res = await withIdempotency(prisma, idempotencyKey, 'BOOST_ROLLOVER', 'PLATFORM', async (tx) => {
                  
                  const newPeriodStart = sub.currentPeriodEnd;
                  const newPeriodEnd = new Date(newPeriodStart.getTime());
                  newPeriodEnd.setUTCMonth(newPeriodEnd.getUTCMonth() + 1); // rough +1 mo calendar safe

                  const newPeriodKey = `${newPeriodStart.getUTCFullYear()}-${String(newPeriodStart.getUTCMonth()+1).padStart(2,'0')}`;

                  if (!sub.autoRenew) {
                       await tx.boostSubscription.update({
                            where: { id: sub.id },
                            data: { status: 'EXPIRED' }
                       });
                       await tx.financeOpsLog.create({
                           data: { action: 'BOOST_SUB_EXPIRED', entityType: 'BoostSubscription', entityId: sub.id, severity: 'INFO', payloadJson: { adminUserId } }
                       });
                       return { success: true, expired: true };
                  }

                  const plan = await tx.boostPlan.findUniqueOrThrow({ where: { id: sub.planId } });

                  const existingInvoice = await tx.boostInvoice.findUnique({
                       where: { subscriptionId_periodKey: { subscriptionId: sub.id, periodKey: newPeriodKey } }
                  });

                  if (!existingInvoice) {
                       const platformAccount = await ensureLedgerAccount(tx, 'PLATFORM_TENANT', plan.currency);
                       const lgId = `GRP_AR_ROL_` + Date.now().toString();
                       const lg = await tx.ledgerGroup.create({
                             data: {
                                  id: lgId,
                                  type: 'INVOICE_ISSUED',
                                  tenantId: 'PLATFORM',
                                  idempotencyKey: `${idempotencyKey}:LG`,
                                 description: `Boost Invoice Rollover AR for ${newPeriodKey}`,
                                 entries: {
                                      create: [
                                          { ledgerAccountId: platformAccount.id, accountType: 'ACCOUNTS_RECEIVABLE', tenantId: 'PLATFORM', direction: 'DEBIT', amount: plan.monthlyPrice, currency: plan.currency },
                                          { ledgerAccountId: platformAccount.id, accountType: 'BOOST_REVENUE', tenantId: 'PLATFORM', direction: 'CREDIT', amount: plan.monthlyPrice, currency: plan.currency }
                                      ]
                                 }
                            }
                       });

                       await tx.boostInvoice.create({
                            data: {
                                 sellerTenantId: sub.sellerTenantId,
                                 subscriptionId: sub.id,
                                 periodKey: newPeriodKey,
                                 amount: plan.monthlyPrice,
                                 currency: plan.currency,
                                 status: 'ISSUED',
                                 issuedAt: new Date(),
                                 dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                                 ledgerGroupId: lg.id
                            }
                       });

                       await tx.financeOpsLog.create({
                           data: { action: 'BOOST_INVOICE_ISSUED_AUTO', entityType: 'BoostSubscription', entityId: sub.id, severity: 'INFO', payloadJson: { adminUserId, periodKey: newPeriodKey } }
                       });
                  }

                  await tx.boostSubscription.update({
                       where: { id: sub.id },
                       data: {
                            currentPeriodStart: newPeriodStart,
                            currentPeriodEnd: newPeriodEnd,
                            nextRenewalAt: newPeriodEnd,
                            lastChargedPeriodKey: newPeriodKey
                       }
                  });

                  return { success: true, renewed: true, periodKey: newPeriodKey };
             });

             results.push(res);
         } catch(e) {
              const err = e as Error;
              results.push({ success: false, id: sub.id, error: err.message });
         }
    }

    return results;
}
