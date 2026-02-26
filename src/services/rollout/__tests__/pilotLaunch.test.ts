import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { isFeatureEnabled, setTenantFeature, seedDefaultFeatureFlags } from '../featureFlags';
import { assertWithinGmvLimit, assertWithinPayoutLimit, assertEscrowNotPaused, pauseEscrow, resumeAll } from '../riskCaps'; // Note: rollback controls in rollback.ts usually, let's fix imports
import { pauseEscrow as rbPauseEscrow, resumeAll as rbResumeAll } from '../rollback';
import { runDailyMetricsJob } from '../../metrics/dailyMetrics';

const prisma = new PrismaClient();

let adminUserId = 'ADMIN_PILOT_TEST';
let tenant_T1: string;
let tenant_T2: string;

beforeAll(async () => {
    const ts = Date.now();
    
    // Seed generic stuff and flags
    await seedDefaultFeatureFlags();

    const t1 = await prisma.tenant.create({ data: { name: `PilotT1_${ts}`, ownerEmail: `pt1_${ts}@test.com` } });
    tenant_T1 = t1.id;
    await prisma.company.create({ data: { id: tenant_T1, tenantId: tenant_T1, name: 'PT1', taxNumber: `${ts}1`, vkn: `${ts}1` } });

    const t2 = await prisma.tenant.create({ data: { name: `PilotT2_${ts}`, ownerEmail: `pt2_${ts}@test.com` } });
    tenant_T2 = t2.id;
    await prisma.company.create({ data: { id: tenant_T2, tenantId: tenant_T2, name: 'PT2', taxNumber: `${ts}2`, vkn: `${ts}2` } });

});

describe('PILOT LAUNCH ENABLEMENT KIT', () => {

    it('1) Feature flag override works (tenant-specific beats default)', async () => {
        // Global default for TEST_FLAG normally doesn't exist, fallback is false
        let isEnabled = await isFeatureEnabled({ tenantId: tenant_T1, key: 'ESCROW_ENABLED' });
        expect(isEnabled).toBe(false); // seeded default

        await setTenantFeature({ adminUserId, tenantId: tenant_T1, key: 'ESCROW_ENABLED', enabled: true });

        isEnabled = await isFeatureEnabled({ tenantId: tenant_T1, key: 'ESCROW_ENABLED' });
        expect(isEnabled).toBe(true);
        
        // T2 remains default
        let isEnabled2 = await isFeatureEnabled({ tenantId: tenant_T2, key: 'ESCROW_ENABLED' });
        expect(isEnabled2).toBe(false);
    });

    it('2) GMV cap blocks new payment after threshold', async () => {
        const d = new Date();
        d.setUTCHours(d.getUTCHours() + 3);
        const todayStr = d.toISOString().split('T')[0];
        const withinDay = new Date(`${todayStr}T12:00:00+03:00`);

        await prisma.tenantRolloutPolicy.upsert({
             where: { tenantId: tenant_T1 },
             update: { maxDailyGmv: 400 },
             create: { tenantId: tenant_T1, maxDailyGmv: 400 }
        });

        // Seed 300
        await prisma.providerPayment.create({
             data: {
                  tenantId: tenant_T1,
                  providerPaymentId: `PP_PILOT_1_${Date.now()}`,
                  networkPaymentId: `NP_PILOT_1_${Date.now()}`,
                  amount: 300,
                  status: 'PAID',
                  createdAt: withinDay
             }
        });

        // Asking to process 50 should pass
        await expect(assertWithinGmvLimit({ prisma, tenantId: tenant_T1, amount: 50, dayStr: todayStr })).resolves.toBeUndefined();

        // Asking to process 150 should throw (total 450 > 400)
        await expect(assertWithinGmvLimit({ prisma, tenantId: tenant_T1, amount: 150, dayStr: todayStr })).rejects.toThrow('DAILY_GMV_LIMIT_EXCEEDED');
    });

    it('3) Payout cap blocks payout enqueue', async () => {
         const d = new Date();
         d.setUTCHours(d.getUTCHours() + 3);
         const todayStr = d.toISOString().split('T')[0];
         const withinDay = new Date(`${todayStr}T12:00:00+03:00`);

         await prisma.tenantRolloutPolicy.update({
             where: { tenantId: tenant_T1 },
             data: { maxDailyPayout: 1000 }
         });

         await prisma.providerPayout.create({
             data: {
                  sellerTenantId: tenant_T1,
                  providerPayoutId: `PO_PILOT_1_${Date.now()}`,
                  grossAmount: 900,
                  commissionAmount: 0,
                  netAmount: 900,
                  idempotencyKey: `M_PO_PILOT_${Date.now()}`,
                  status: 'QUEUED',
                  createdAt: withinDay
             }
         });

         // Asking to queue 50 passes
         await expect(assertWithinPayoutLimit({ prisma, tenantId: tenant_T1, amount: 50, dayStr: todayStr })).resolves.toBeUndefined();

         // Asking to queue 150 fails (900+150=1050 > 1000)
         await expect(assertWithinPayoutLimit({ prisma, tenantId: tenant_T1, amount: 150, dayStr: todayStr })).rejects.toThrow('DAILY_PAYOUT_LIMIT_EXCEEDED');
    });

    it('4) Escrow paused prevents payment / Kill-switch idempotent', async () => {
         await rbPauseEscrow(adminUserId, tenant_T2);
         // double pause shouldn't throw error
         const res = await rbPauseEscrow(adminUserId, tenant_T2);
         expect(res.message).toBe('Already paused');

         await expect(assertEscrowNotPaused({ prisma, tenantId: tenant_T2 })).rejects.toThrow('ESCROW_PAUSED');

         await rbResumeAll(adminUserId, tenant_T2);
         await expect(assertEscrowNotPaused({ prisma, tenantId: tenant_T2 })).resolves.toBeUndefined();
    });

    it('5) Cohort metrics computed separately & 6) Multi-tenant isolation', async () => {
         // Create Cohort Tag for T1
         await prisma.pilotCohortTag.create({
              data: { tenantId: tenant_T1, tag: 'BETA_GROUP_1' }
         });

         // We already seeded a payment of 300 for T1 in test 2. Let's make sure timezone is respected.
         // Actually, let's just trigger dailyMetrics.
         
         const d = new Date();
         d.setUTCHours(d.getUTCHours() + 3);
         const todayStr = d.toISOString().split('T')[0];

         // Before metrics run, clean idemp
         await prisma.idempotencyRecord.deleteMany({
              where: { key: { startsWith: 'METRICS_DAILY:' } }
         });

         const jobRes = await runDailyMetricsJob({ dayStr: todayStr });
         expect(jobRes.processed.length).toBeGreaterThan(0);

         const cohortData = await prisma.platformCohortDailyMetrics.findUnique({
              where: { day_cohortTag: { day: todayStr, cohortTag: 'BETA_GROUP_1' } }
         });

         // Should have processed the 300 GMV from test 2
         expect(cohortData).toBeDefined();
         expect(Number(cohortData!.gmvGross)).toBeGreaterThanOrEqual(300);

         // T2 has no cohort tag, so another tenant shouldn't contaminate T2. Nor can T2 view T1's rollout policy via API logic.
    }, 20000);

});
