import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function chargeBoostSubscriptionUpfront(params: {
     adminUserId: string;
     subscriptionId: string;
}) {
    const { adminUserId, subscriptionId } = params;

    return prisma.$transaction(async (tx) => {
         // 1) Validate subscription
         const sub = await tx.boostSubscription.findUnique({
              where: { id: subscriptionId },
              include: { plan: true }
         });

         if (!sub || sub.status !== 'ACTIVE') {
              throw new Error('Subscription not active');
         }

         // Current period
         const pStart = sub.currentPeriodStart;
         const periodKey = `${pStart.getUTCFullYear()}-${String(pStart.getUTCMonth()+1).padStart(2,'0')}`;
         const idempotencyKey = `BOOST_CHARGE:${subscriptionId}:${periodKey}`;

         // 2) Check if already billed
         const existingRef = await tx.billingLedgerRef.findUnique({
              where: { idempotencyKey }
         });

         if (existingRef) {
              return { success: true, message: 'Already billed for current period', ref: existingRef };
         }

         const chargeAmount = sub.plan.monthlyPrice;

         // 3) Create Ledger Entries
         const groupId = `BOOST_BILLING_${periodKey}_${subscriptionId.slice(-8)}`;
         
         await tx.ledgerGroup.create({
             data: {
                  id: groupId,
                  type: 'SETTLEMENT', // Or "BILLING"
                  tenantId: 'PLATFORM_TENANT_ID',
                  description: `Upfront charge for plan: ${sub.plan.code} for ${periodKey}`,
                  idempotencyKey
             }
         });

         const pltCompany = await tx.company.findUnique({ where: { id: 'PLATFORM_TENANT_ID' }});
         if (!pltCompany) {
             const pltTenant = await tx.tenant.upsert({
                 where: { id: 'PLATFORM_TENANT_ID' },
                 update: {},
                 create: { id: 'PLATFORM_TENANT_ID', name: 'Periodya Platform', ownerEmail: 'admin@periodya.com' }
             });
             await tx.company.create({
                 data: { id: 'PLATFORM_TENANT_ID', tenantId: pltTenant.id, name: 'Periodya Platform', taxNumber: '1111111111', vkn: '1111111111' }
             });
         }

         // Ensure Platform Tenant LedgerAccount exists (often seeded, but we upsert for safety here)
         const platformAccount = await tx.ledgerAccount.upsert({
              where: { companyId: 'PLATFORM_TENANT_ID' },
              update: {},
              create: { companyId: 'PLATFORM_TENANT_ID', currency: 'TRY' }
         });

         // Platform Accounts Receivable (Debit) <- Platform expecting to be paid
         await tx.ledgerEntry.create({
              data: {
                   groupId,
                   tenantId: 'PLATFORM_TENANT_ID',
                   ledgerAccountId: platformAccount.id,
                   accountType: 'PLATFORM_ACCOUNTS_RECEIVABLE',
                   direction: 'DEBIT',
                   amount: chargeAmount,
                   refType: 'BOOST_SUBSCRIPTION',
                   referenceId: subscriptionId
              }
         });

         // Boost Revenue (Credit) <- The actual income recognized
         await tx.ledgerEntry.create({
              data: {
                   groupId,
                   tenantId: 'PLATFORM_TENANT_ID',
                   ledgerAccountId: platformAccount.id,
                   accountType: 'BOOST_REVENUE',
                   direction: 'CREDIT',
                   amount: chargeAmount,
                   refType: 'BOOST_SUBSCRIPTION',
                   referenceId: subscriptionId
              }
         });

         // 4) Track Ref
         const ref = await tx.billingLedgerRef.create({
              data: {
                   entityType: 'BOOST_SUBSCRIPTION_CHARGE',
                   entityId: subscriptionId,
                   idempotencyKey,
                   ledgerGroupId: groupId
              }
         });

         // 5) Audit
         await tx.financeOpsLog.create({
              data: {
                   action: 'BOOST_SUBSCRIPTION_CHARGED',
                   entityType: 'BoostSubscription',
                   entityId: subscriptionId,
                   severity: 'INFO',
                   payloadJson: { adminUserId, chargeAmount, periodKey, groupId }
              }
         });

         return { success: true, ref };
    });
}
