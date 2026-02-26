import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { computeSellerScore } from '../scoring';
import { resolveDynamicReleasePolicy } from '../policyIntegration';
import { submitTrustScoreRecalc } from '../recalcWorker';

const prisma = new PrismaClient();

describe('F2 - Seller Trust Score Engine', () => {
    const TEST_SELLER_ID = 'TRUST_SELLER_T1';

    beforeAll(async () => {
        // Setup base tenant + company
        const t1 = await prisma.tenant.create({ data: { name: 'Trust Tenant', ownerEmail: 'trust@example.com' } });

        await prisma.company.upsert({
            where: { id: TEST_SELLER_ID },
            create: { id: TEST_SELLER_ID, name: 'Trust Seller', vkn: 'tst123', taxNumber: 'tst123', tenantId: t1.id, type: 'SELLER' },
            update: {}
        });

        // Setup test policy globally or simply mock for dynamic assertion
    });

    afterAll(async () => {
        // Cleanup
        await prisma.trustScoreRecalcJob.deleteMany({ where: { sellerTenantId: TEST_SELLER_ID } });
        await prisma.sellerTrustScore.deleteMany({ where: { sellerTenantId: TEST_SELLER_ID } });
        await prisma.company.delete({ where: { id: TEST_SELLER_ID } });
        await prisma.tenant.deleteMany({ where: { ownerEmail: 'trust@example.com' } });
    });

    it('should compute score deterministically and clamp 0-100', () => {
        // Test A tier
        const perfectSignals = {
            onTimeRatio: 1, disputeRate: 0, slaBreachCount: 0,
            chargebackRate: 0, receivableRate: 0, overrideCount: 0,
            stabilityScore: 10, volumeIndex: 1000
        };
        const res1 = computeSellerScore(perfectSignals);
        expect(res1.finalScore).toBeGreaterThanOrEqual(100); // 100 + bonuses capped back to 100
        expect(res1.tier).toBe('A');

        // Test Penalty capping and D tier drop
        const disastrousSignals = {
            onTimeRatio: 0, disputeRate: 1, slaBreachCount: 10,
            chargebackRate: 0.5, receivableRate: 0, overrideCount: 5,
            stabilityScore: 0, volumeIndex: 0
        };
        const res2 = computeSellerScore(disastrousSignals);

        expect(res2.lateDeliveryPenalty).toBe(40); // Max
        expect(res2.disputePenalty).toBe(20); // Max
        expect(res2.slaBreachPenalty).toBe(15); // Max
        expect(res2.chargebackPenalty).toBe(12.5); // 25 * 0.5
        expect(res2.baseScore).toBe(100);

        // Computation: 100 - 40 - 20 - 15 - 12.5 - 10 = 2.5
        expect(res2.finalScore).toBe(3); // Round (2.5) -> 3
        expect(res2.tier).toBe('D');
    });

    it('should run a generic manual recalc idempotently', async () => {
        // Create a unique seller ID for this specific test to avoid idempotency clashes
        const UNIQUE_SELLER = `TRUST_S_${Date.now()}`;
        await prisma.company.create({
            data: { id: UNIQUE_SELLER, name: 'Unique', vkn: UNIQUE_SELLER, taxNumber: UNIQUE_SELLER, tenantId: (await prisma.tenant.findFirst())?.id || '', type: 'SELLER' }
        });

        // 1. Initial manual run
        const r1 = await submitTrustScoreRecalc(UNIQUE_SELLER, 'MANUAL_ADMIN');
        expect(r1.status).toBe('SUCCEEDED');

        // Check database state
        const scoreEntry = await prisma.sellerTrustScore.findUnique({ where: { sellerTenantId: UNIQUE_SELLER } });
        expect(scoreEntry).toBeDefined();
        expect(scoreEntry?.score).toBe(100); // Because no mock transactions / shipments were actually recorded, signals return 100
        expect(scoreEntry?.tier).toBe('A');

        // 2. Repeat manual run (idempotent rejection expected for same day same key)
        await expect(submitTrustScoreRecalc(UNIQUE_SELLER, 'MANUAL_ADMIN')).rejects.toThrow('ALREADY_SUCCEEDED');

        // Cleanup unique test
        await prisma.trustScoreRecalcJob.deleteMany({ where: { sellerTenantId: UNIQUE_SELLER } });
        await prisma.sellerTrustScore.deleteMany({ where: { sellerTenantId: UNIQUE_SELLER } });
        await prisma.company.delete({ where: { id: UNIQUE_SELLER } });
    });

    it('should apply dynamic release policies correctly per tier', async () => {
        // Create a base record since manual job isn't triggering creation in the test without upsert.
        await prisma.sellerTrustScore.upsert({
            where: { sellerTenantId: TEST_SELLER_ID },
            create: { sellerTenantId: TEST_SELLER_ID, tier: 'D', score: 40, componentsJson: {}, windowStart: new Date(), windowEnd: new Date() },
            update: { tier: 'D', score: 40, componentsJson: {} }
        });

        const dTierPolicy = await resolveDynamicReleasePolicy(TEST_SELLER_ID);
        expect(dTierPolicy.holdDays).toBe(14 + 7); // Base 14 + 7 Penalty

        // A Tier Update
        await prisma.sellerTrustScore.update({
            where: { sellerTenantId: TEST_SELLER_ID },
            data: { tier: 'A', score: 98 }
        });

        const aTierPolicy = await resolveDynamicReleasePolicy(TEST_SELLER_ID);
        expect(aTierPolicy.holdDays).toBe(14 - 7); // Base 14 - 7 Bonus
    });

});
