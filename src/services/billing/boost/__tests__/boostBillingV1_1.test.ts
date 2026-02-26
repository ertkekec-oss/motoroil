import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { issueBoostInvoice, markBoostInvoicePaid } from '../invoices';
import { runBoostSubscriptionRolloverCycle } from '../rollover';

const prisma = new PrismaClient();
let adminUserId = 'ADMIN_TEST';
let sellerTenantId: string;
let subscriptionId: string;
let planId: string;

beforeAll(async () => {
    const ts = Date.now();
    const t = await prisma.tenant.create({ data: { name: `V11_${ts}`, ownerEmail: `v11_${ts}@ex.com` } });
    sellerTenantId = t.id;

    await prisma.company.create({ data: { id: t.id, tenantId: t.id, name: 'V11 C', vkn: `vkn${ts}`, taxNumber: `tx${ts}` } });

    // Ensure PLATFORM_TENANT company exists for LedgerAccount creation
    await prisma.company.upsert({
        where: { id: 'PLATFORM_TENANT' },
        update: {},
        create: { id: 'PLATFORM_TENANT', tenantId: t.id, name: 'Platform', vkn: 'plat_vkn', taxNumber: 'plat_tax' }
    });

    const p = await prisma.boostPlan.create({
        data: {
             code: `TEST_PLAN_${ts}`,
             name: 'Test Plan',
             monthlyPrice: 500.00,
             monthlyImpressionQuota: 10000
        }
    });
    planId = p.id;

    // Create a mock active subscription, slightly in the past
    const now = new Date();
    const start = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    const end = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);   // ended 10 days ago

    const sub = await prisma.boostSubscription.create({
         data: {
              sellerTenantId,
              planId,
              status: 'ACTIVE',
              startAt: start,
              currentPeriodStart: start,
              currentPeriodEnd: end,
              nextRenewalAt: end, // indicates it needs renewal
              autoRenew: true
         }
    });
    subscriptionId = sub.id;
});

describe('BOOST BILLING v1.1 - Invoicing, AR vs Cash, Rollover', () => {
     let invoiceId: string;

     it('1) issueBoostInvoice idempotent (no double ledger)', async () => {
         // Issue invoice
         const pk = `2026-04-${Date.now()}`;
         const inv = await issueBoostInvoice({ adminUserId, subscriptionId, periodKey: pk });
         expect(inv).toBeDefined();
         expect(inv.status).toBe('ISSUED');
         expect(inv.ledgerGroupId).toBeDefined();

         invoiceId = inv.id;

         // Check basic ledger insertion
         const entries = await prisma.ledgerEntry.findMany({ where: { groupId: inv.ledgerGroupId! } });
         expect(entries.length).toBe(2);
         expect(entries.some(e => e.accountType === 'ACCOUNTS_RECEIVABLE' && e.direction === 'DEBIT')).toBe(true);
         expect(entries.some(e => e.accountType === 'BOOST_REVENUE' && e.direction === 'CREDIT')).toBe(true);

         // Second call should throw immediately due to idempotency / uniqueness
         await expect(issueBoostInvoice({ adminUserId, subscriptionId, periodKey: pk })).rejects.toThrow();
     });

     it('2) AR balance correct before payment', async () => {
         // We do a manual sum test strictly targeting the AR ledger entries for this group
         const inv = await prisma.boostInvoice.findUnique({ where: { id: invoiceId } });
         
         const debits = await prisma.ledgerEntry.aggregate({
              _sum: { amount: true },
              where: { groupId: inv!.ledgerGroupId!, accountType: 'ACCOUNTS_RECEIVABLE', direction: 'DEBIT' }
         });
         expect(debits._sum.amount?.toNumber()).toBeGreaterThan(0);
         expect(debits._sum.amount?.toNumber()).toBe(500.00); // Plan price
     });

     it('3) markBoostInvoicePaid idempotent & correct CASH balance', async () => {
         const paid = await markBoostInvoicePaid({ adminUserId, invoiceId });
         expect(paid.status).toBe('PAID');
         expect(paid.paidAt).toBeDefined();

         // The newly created ledger for the payment should shift AR to CASH
         const payLg = await prisma.ledgerGroup.findFirst({
              where: { idempotencyKey: `BOOST_INVOICE_PAYMENT:${invoiceId}` },
              include: { entries: true }
         });

         expect(payLg).toBeDefined();
         expect(payLg?.entries.some(e => e.accountType === 'ACCOUNTS_RECEIVABLE' && e.direction === 'CREDIT')).toBe(true);
         expect(payLg?.entries.some(e => e.accountType === 'PLATFORM_WALLET' && e.direction === 'DEBIT')).toBe(true); // Cash increase

         // Idempotency: try paying again -> should throw ALREADY_SUCCEEDED or return
         try {
             const paid2 = await markBoostInvoicePaid({ adminUserId, invoiceId });
             expect(paid2.id).toEqual(paid.id);
         } catch (e: any) {
             expect(e.message).toBe('ALREADY_SUCCEEDED');
         }
     });

     it('4) rollover creates new period only once', async () => {
         // Run the rollover job
         const res = await runBoostSubscriptionRolloverCycle(adminUserId, subscriptionId);
         
         // Should find our test sub and renew it
         const r = res.find((x: any) => x.renewed === true);
         expect(r).toBeDefined();
         expect(r?.success).toBe(true);
         expect(r?.periodKey).toBeDefined();

         // Attempt again immediately
         const res2 = await runBoostSubscriptionRolloverCycle(adminUserId, subscriptionId);
         // Next renewal is now explicitly in the future, so query should be empty/find zero
         expect(res2.length).toBe(0);

         // Validate DB state
         const subDb = await prisma.boostSubscription.findUnique({ where: {id: subscriptionId} });
         expect(subDb?.currentPeriodStart).toBeDefined();
         expect(subDb?.nextRenewalAt.getTime()).toBeGreaterThan(Date.now());
     });
});
