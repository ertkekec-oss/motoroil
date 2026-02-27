import { describe, it, expect, vi, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runBoostCollectionGuard } from '../collectionGuard';
import { markBoostInvoicePaid } from '../invoices';
import { getActiveBoostSubscription } from '../subscriptions';
import { runBoostBillingHealthSnapshot } from '../health';

const prisma = new PrismaClient();

const adminUserId = 'ADMIN_TEST_GUARD';

describe('BOOST BILLING v1.2 - Collection Guard & Health', () => {
     let sellerTenantId: string;
     let subscriptionId: string;
     let invoiceId: string;
     let planId: string;

     beforeAll(async () => {
         const ts = Date.now();
         
         const t = await prisma.tenant.create({ data: { name: `Guard Tenant ${ts}`, status: 'ACTIVE', ownerEmail: `test${ts}@example.com` } });
         sellerTenantId = t.id;

         await prisma.company.create({ data: { id: t.id, tenantId: t.id, name: 'Guard C', vkn: `vkn${ts}`, taxNumber: `tx${ts}` } });

         // Ensure PLATFORM_TENANT company exists for LedgerAccount creation
         await prisma.company.upsert({
             where: { id: 'PLATFORM_TENANT' },
             update: {},
             create: { id: 'PLATFORM_TENANT', tenantId: t.id, name: 'Platform', vkn: 'plat_vkn', taxNumber: 'plat_tax' }
         });

         const p = await prisma.boostPlan.create({
             data: {
                  code: `TEST_PLAN_GUARD_${ts}`,
                  name: 'Test Guard Plan',
                  monthlyPrice: 500,
                  currency: 'TRY',
                  monthlyImpressionQuota: 10000,
                  isActive: true
             }
         });
         planId = p.id;

         const now = new Date();
         const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth()+1);

         const sub = await prisma.boostSubscription.create({
             data: {
                  sellerTenantId,
                  planId,
                  status: 'ACTIVE',
                  startAt: now,
                  currentPeriodStart: now,
                  currentPeriodEnd: nextMonth,
                  billingBlocked: false
             }
         });
         subscriptionId = sub.id;

         // Simulate an invoice that is just PAST due
         const pastDue = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

         const inv = await prisma.boostInvoice.create({
             data: {
                 sellerTenantId,
                 subscriptionId,
                 periodKey: `TEST-${ts}`,
                 amount: 500,
                 currency: 'TRY',
                 status: 'ISSUED',
                 collectionStatus: 'CURRENT',
                 issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                 dueAt: pastDue
             }
         });
         invoiceId = inv.id;
     });

     it('1) Invoice enters GRACE after dueAt has passed', async () => {
         const res = await runBoostCollectionGuard(adminUserId, 5, invoiceId);
         expect(res.gracedCount).toBeGreaterThanOrEqual(1);

         const inv = await prisma.boostInvoice.findUnique({ where: { id: invoiceId } });
         expect(inv?.collectionStatus).toBe('GRACE');
         expect(inv?.graceEndsAt).not.toBeNull();
         expect(inv?.overdueAt).toBeNull();
     });

     it('2) Idempotent multiple guard runs', async () => {
         const res = await runBoostCollectionGuard(adminUserId, 5, invoiceId);
         expect(res.gracedCount).toBe(0); // already entered
         expect(res.overdueCount).toBe(0); // not overdue yet
     });

     it('3) Invoice enters OVERDUE after graceEndsAt (simulating time machine) & Subscription Auto-pauses', async () => {
         const graceEndsPast = new Date(Date.now() - 5000); // 5 sec ago
         await prisma.boostInvoice.update({
             where: { id: invoiceId },
             data: { graceEndsAt: graceEndsPast }
         });

         const res = await runBoostCollectionGuard(adminUserId, 5, invoiceId);
         expect(res.overdueCount).toBeGreaterThanOrEqual(1);

         const inv = await prisma.boostInvoice.findUnique({ where: { id: invoiceId } });
         expect(inv?.collectionStatus).toBe('OVERDUE');
         expect(inv?.overdueAt).not.toBeNull();

         const sub = await prisma.boostSubscription.findUnique({ where: { id: subscriptionId } });
         expect(sub?.billingBlocked).toBe(true);
         expect(sub?.status).toBe('PAUSED');

         const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId: sellerTenantId } });
         expect(policy?.boostPaused).toBe(true);
     });

     it('4) Discovery eligibility blocked when overdue', async () => {
         const activeSub = await getActiveBoostSubscription(sellerTenantId);
         expect(activeSub).toBeNull(); // Missing because status is PAUSED / OVERDUE
     });

     it('5) Billing health snapshot calculates accurate totals', async () => {
         const snapshot = await runBoostBillingHealthSnapshot();
         expect(snapshot).toBeDefined();
         expect(snapshot.totalOutstandingAR.toNumber()).toBeGreaterThanOrEqual(500);
         expect(snapshot.overdueInvoiceCount).toBeGreaterThanOrEqual(1);
         expect(snapshot.blockedSubscriptionCount).toBeGreaterThanOrEqual(1);
     });

     it('6) Payment unblocks subscription completely', async () => {
         const paid = await markBoostInvoicePaid({ adminUserId, invoiceId });
         expect(paid.status).toBe('PAID');
         expect(paid.collectionStatus).toBe('CURRENT');

         const sub = await prisma.boostSubscription.findUnique({ where: { id: subscriptionId } });
         expect(sub?.billingBlocked).toBe(false);
         expect(sub?.status).toBe('ACTIVE');

         const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId: sellerTenantId } });
         expect(policy?.boostPaused).toBe(false);

         const activeSub = await getActiveBoostSubscription(sellerTenantId);
         expect(activeSub?.id).toBe(subscriptionId); // now visible again
     });
});
