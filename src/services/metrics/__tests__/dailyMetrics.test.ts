import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { runDailyMetricsJob } from '../dailyMetrics';

const prisma = new PrismaClient();

let tenantBuyer1: string;
let tenantSeller1: string;

beforeAll(async () => {
    const ts = Date.now();
    
    // Create platform
    const p = await prisma.tenant.findUnique({ where: { id: 'PLATFORM' } });
    if (!p) {
        await prisma.tenant.create({ data: { id: 'PLATFORM', name: 'PLATFORM', ownerEmail: `sysMETRICS-${ts}@biz.com` } });
        await prisma.company.create({ data: { id: 'PLATFORM', tenantId: 'PLATFORM', name: 'PLATFORM', taxNumber: `${ts}P`, vkn: `${ts}P` } });
        await prisma.ledgerAccount.create({ data: { id: 'PLATFORM_REVENUE_ACCT', companyId: 'PLATFORM', availableBalance: 0 } });
    }

    const tb1 = await prisma.tenant.create({ data: { name: `tB1_${ts}`, ownerEmail: `mb1_${ts}@test.com` } });
    tenantBuyer1 = tb1.id;
    await prisma.company.create({ data: { id: tenantBuyer1, tenantId: tenantBuyer1, name: 'B1', taxNumber: `${ts}B1`, vkn: `${ts}B1` } });

    const ts1 = await prisma.tenant.create({ data: { name: `tS1_${ts}`, ownerEmail: `ms1_${ts}@test.com` } });
    tenantSeller1 = ts1.id;
    await prisma.company.create({ data: { id: tenantSeller1, tenantId: tenantSeller1, name: 'S1', taxNumber: `${ts}S1`, vkn: `${ts}S1` } });

    // Clear idempotency records
    await prisma.idempotencyRecord.deleteMany({
        where: { key: { startsWith: 'METRICS_DAILY:' } }
    });
});

describe('FINANCE METRICS LAYER', () => {

    it('1) Computes Platform and Tenant metrics correctly', async () => {
        const fixedToday = '2026-02-27';
        const withinDay = new Date(`${fixedToday}T12:00:00+03:00`);

        // Seed provider payment PAID (buyer)
        await prisma.providerPayment.create({
            data: {
                tenantId: tenantBuyer1,
                providerPaymentId: `PP_M_${Date.now()}`,
                networkPaymentId: `NP_M_${Date.now()}`,
                amount: 500,
                status: 'PAID',
                createdAt: withinDay
            }
        });

        // Seed provider payout SUCCEEDED (seller)
        await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenantSeller1,
                providerPayoutId: `PO_M_${Date.now()}`,
                grossAmount: 500,
                commissionAmount: 50,
                netAmount: 450,
                idempotencyKey: `M_PO_${Date.now()}`,
                status: 'SUCCEEDED',
                createdAt: withinDay,
                updatedAt: withinDay
            }
        });

        // Add some commission revenue
        const grp = await prisma.ledgerGroup.create({
             data: { tenantId: 'PLATFORM', type: 'FEE', description: 'desc', idempotencyKey: `METRIC_LG_${Date.now()}` }
        });
        const pLedger = await prisma.ledgerAccount.findUnique({ where: { id: 'PLATFORM_REVENUE_ACCT' } });
        await prisma.ledgerEntry.create({
            data: {
                tenantId: 'PLATFORM',
                groupId: grp.id,
                ledgerAccountId: pLedger!.id,
                accountType: 'PLATFORM_REVENUE',
                direction: 'CREDIT',
                amount: 50,
                currency: 'TRY',
                createdAt: withinDay
            }
        });

        const res = await runDailyMetricsJob({ dayStr: fixedToday });
        expect(res).toBeDefined();

        // Assert PlatformMetrics
        const platM = await prisma.platformDailyMetrics.findUnique({ where: { day: fixedToday } });
        expect(platM).toBeDefined();
        expect(Number(platM!.gmvGross)).toBeGreaterThanOrEqual(500);
        expect(Number(platM!.payoutVolume)).toBeGreaterThanOrEqual(450);
        expect(Number(platM!.takeRevenueCommission)).toBeGreaterThanOrEqual(50);

        // Assert TenantMetrics (Buyer)
        const tbM = await prisma.tenantDailyMetrics.findUnique({ where: { day_tenantId: { day: fixedToday, tenantId: tenantBuyer1 } } });
        expect(tbM).toBeDefined();
        expect(tbM!.role).toBe('BUYER');
        expect(Number(tbM!.gmvGross)).toBeGreaterThanOrEqual(500);

        // Assert TenantMetrics (Seller)
        const tsM = await prisma.tenantDailyMetrics.findUnique({ where: { day_tenantId: { day: fixedToday, tenantId: tenantSeller1 } } });
        expect(tsM).toBeDefined();
        expect(tsM!.role).toBe('SELLER');
        expect(Number(tsM!.payoutReceived)).toBeGreaterThanOrEqual(450);
    }, 20000);

    it('2) Idempotent operation prevents duplicated rows and respects backfill', async () => {
         const fixedToday = '2026-02-27';
         
         const r1 = await runDailyMetricsJob({ dayStr: fixedToday, backfillDays: 1 });
         const r2 = await runDailyMetricsJob({ dayStr: fixedToday, backfillDays: 1 });
         
         // Should have 2 backfill days
         expect(r1.processed.length).toBe(2); 

         const pCount = await prisma.platformDailyMetrics.count({ where: { day: fixedToday } });
         expect(pCount).toBe(1); // Upsert logic prevents duplicates
    }, 20000);

});
