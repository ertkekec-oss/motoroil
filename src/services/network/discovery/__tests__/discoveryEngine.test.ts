import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { rankNetworkListings } from '../ranking';
import { createBoostRule, deactivateBoostRule } from '../boosts';

const prisma = new PrismaClient();

vi.mock('../../../billing/boost/quota', () => ({
    hasSponsoredQuota: vi.fn().mockResolvedValue(true)
}));

describe('F3 - Discovery & Boost Engine', () => {
    let viewerCompanyId: string;
    let sellerA: string;
    let sellerD: string;
    let globalProductId1: string;
    let listingAId: string;
    let listingDId: string;
    let privateListingId: string;

    beforeAll(async () => {
        // Setup Tenant & Viewer
        const vt = await prisma.tenant.create({ data: { name: 'Viewer Tenant', ownerEmail: 'viewer@ex.com' } });
        const vc = await prisma.company.create({ data: { id: `VIEWER_COMPANY_${Date.now()}`, name: 'Viewer Co', vkn: `vc${Date.now()}`, taxNumber: 'v123', tenantId: vt.id, type: 'BUYER' } });
        viewerCompanyId = vc.id;

        // Setup Sellers
        const stA = await prisma.tenant.create({ data: { name: 'Seller A Tenant', ownerEmail: 'sa@ex.com' } });
        const scA = await prisma.company.create({ data: { id: `SELLER_A_${Date.now()}`, name: 'Seller A', vkn: `vA${Date.now()}`, taxNumber: 'sA123', tenantId: stA.id, type: 'SELLER' } });
        sellerA = scA.id;

        const stD = await prisma.tenant.create({ data: { name: 'Seller D Tenant', ownerEmail: 'sd@ex.com' } });
        const scD = await prisma.company.create({ data: { id: `SELLER_D_${Date.now()}`, name: 'Seller D', vkn: `vD${Date.now()}`, taxNumber: 'sD123', tenantId: stD.id, type: 'SELLER' } });
        sellerD = scD.id;

        // Setup Trust Scores
        await prisma.sellerTrustScore.create({ data: { sellerTenantId: sellerA, score: 95, tier: 'A', componentsJson: {}, windowStart: new Date(), windowEnd: new Date() } });
        await prisma.sellerTrustScore.create({ data: { sellerTenantId: sellerD, score: 40, tier: 'D', componentsJson: {}, windowStart: new Date(), windowEnd: new Date() } });

        // Setup Test Products
        const cat = await prisma.globalCategory.create({ data: { id: `CAT_${Date.now()}`, name: 'TestCat', slug: `testcat_${Date.now()}` } });
        const gp1 = await prisma.globalProduct.create({ data: { id: `GP_${Date.now()}`, name: 'Test Product 1', categoryId: cat.id } });
        globalProductId1 = gp1.id;

        // Setup Test Listings
        // First we need ERP products to satisfy relation
        const erpA = await prisma.product.create({ data: { id: `ERPA_${Date.now()}`, companyId: sellerA, name: 'Prod A', type: 'GOODS', code: `CODE_A_${Date.now()}`, price: 100 } });
        const erpD = await prisma.product.create({ data: { id: `ERPD_${Date.now()}`, companyId: sellerD, name: 'Prod D', type: 'GOODS', code: `CODE_D_${Date.now()}`, price: 90 } });
        const erpPriv = await prisma.product.create({ data: { id: `ERPP_${Date.now()}`, companyId: sellerA, name: 'Prod P', type: 'GOODS', code: `CODE_P_${Date.now()}`, price: 50 } });

        // 1. Seller A (High Trust, Network Visible)
        const lA = await prisma.networkListing.create({
            data: {
                id: `LISTING_A_${Date.now()}`,
                globalProductId: globalProductId1,
                sellerCompanyId: sellerA,
                erpProductId: erpA.id,
                price: 100,
                availableQty: 50,
                leadTimeDays: 2,
                visibility: 'NETWORK',
                status: 'ACTIVE'
            }
        });
        listingAId = lA.id;

        // 2. Seller D (Low Trust, Network Visible)
        const lD = await prisma.networkListing.create({
            data: {
                id: `LISTING_D_${Date.now()}`,
                globalProductId: globalProductId1,
                sellerCompanyId: sellerD,
                erpProductId: erpD.id,
                price: 90, // Better price to verify trust weight
                availableQty: 50,
                leadTimeDays: 2,
                visibility: 'NETWORK',
                status: 'ACTIVE'
            }
        });
        listingDId = lD.id;

        // 3. Seller A (Private Visible)
        const lPriv = await prisma.networkListing.create({
            data: {
                id: `LISTING_PRIV_${Date.now()}`,
                globalProductId: globalProductId1,
                sellerCompanyId: sellerA,
                erpProductId: erpPriv.id,
                price: 50,
                availableQty: 50,
                leadTimeDays: 1,
                visibility: 'PRIVATE',
                status: 'ACTIVE'
            }
        });
        privateListingId = lPriv.id;
    });

    afterAll(async () => {
        // Cleanup all records created in beforeAll based on handles/tenantIDs
        await prisma.networkListing.deleteMany({ where: { OR: [{ sellerCompanyId: sellerA }, { sellerCompanyId: sellerD }] } });
        await prisma.globalProduct.deleteMany({ where: { id: globalProductId1 } });
        await prisma.sellerTrustScore.deleteMany({ where: { OR: [{ sellerTenantId: sellerA }, { sellerTenantId: sellerD }] } });
        await prisma.financeAuditLog.deleteMany({ where: { tenantId: viewerCompanyId } });
        await prisma.company.deleteMany({ where: { OR: [{ id: viewerCompanyId }, { id: sellerA }, { id: sellerD }] } });
        await prisma.tenant.deleteMany({ where: { ownerEmail: { in: ['viewer@ex.com', 'sa@ex.com', 'sd@ex.com'] } } });
        // The rest cascasde deletes.
    });

    it('should only return NETWORK visible listings', async () => {
        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: {},
            sortMode: 'RELEVANCE'
        });

        // Ensure private is not returned
        expect(results.some(r => r.listingId === privateListingId)).toBe(false);
        // Ensure network are returned
        expect(results.some(r => r.listingId === listingAId)).toBe(true);
        expect(results.some(r => r.listingId === listingDId)).toBe(true);
    });

    it('should rank Seller A above Seller D primarily due to Trust Score', async () => {
        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: {},
            sortMode: 'RELEVANCE'
        });

        const indexA = results.findIndex(r => r.listingId === listingAId);
        const indexD = results.findIndex(r => r.listingId === listingDId);

        // Seller A should be higher priority (smaller index) than Seller D despite Seller D having cheaper price
        expect(indexA).toBeLessThan(indexD);

        // Assert Explainability components present
        const breakA = results[indexA].scoreBreakdown;
        expect(breakA?.trustTier).toBe('A');
        expect(breakA?.boosted).toBe(false);
    });

    it('should apply boost rules to Seller A, but prevent boosting Seller D', async () => {
        // Create boosts for both
        const bA = await createBoostRule({
            scope: 'LISTING', targetId: listingAId, multiplier: 2.0, startsAt: new Date(), endsAt: new Date(Date.now() + 1000000), createdByTenantId: viewerCompanyId
        });
        const bD = await createBoostRule({
            scope: 'LISTING', targetId: listingDId, multiplier: 2.0, startsAt: new Date(), endsAt: new Date(Date.now() + 1000000), createdByTenantId: viewerCompanyId
        });

        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: {},
            sortMode: 'RELEVANCE'
        });

        const itemA = results.find(r => r.listingId === listingAId);
        const itemD = results.find(r => r.listingId === listingDId);

        // Seller A should get boosted
        expect(itemA?.scoreBreakdown?.boosted).toBe(true);
        expect(itemA?.scoreBreakdown?.boostMultiplier).toBe(2.0);

        // Seller D is Tier D so its boost multiplier should be capped at 1.0, but still flagged as sponsored conceptually
        expect(itemD?.scoreBreakdown?.boosted).toBe(true);
        expect(itemD?.isSponsored).toBe(true);
        expect(itemD?.scoreBreakdown?.boostMultiplier).toBe(1.0);

        // Cleanup
        await deactivateBoostRule(bA.id, viewerCompanyId);
        await deactivateBoostRule(bD.id, viewerCompanyId);
    });

    it('should correctly filter listings based on criteria', async () => {
        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: { sellerTierMin: 'B' },
            sortMode: 'RELEVANCE'
        });

        // Since filter is Min B, Seller D should be excluded
        expect(results.some(r => r.listingId === listingDId)).toBe(false);
        expect(results.some(r => r.listingId === listingAId)).toBe(true);
    });

    it('should resolve equal finalScores deterministically by listingId asc', async () => {
        // Create twin Product
        const erpATwin = await prisma.product.create({ data: { id: `ERPA_TWIN_${Date.now()}`, companyId: sellerA, name: 'Prod A Twin', type: 'GOODS', code: `CODE_A_TWIN_${Date.now()}`, price: 100 } });

        // Sync creation time so recency is identical
        const frozenDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await prisma.networkListing.update({ where: { id: listingAId }, data: { createdAt: frozenDate } });

        const lATwin = await prisma.networkListing.create({
            data: {
                id: `LISTING_A0_TWIN_${Date.now()}`, // Force a specific ID
                globalProductId: globalProductId1,
                sellerCompanyId: sellerA,
                erpProductId: erpATwin.id,
                price: 100,
                availableQty: 50,
                leadTimeDays: 2,
                visibility: 'NETWORK',
                status: 'ACTIVE',
                createdAt: frozenDate
            }
        });

        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: {},
            sortMode: 'RELEVANCE'
        });

        const idxA = results.findIndex(r => r.listingId === listingAId);
        const idxTwin = results.findIndex(r => r.listingId === lATwin.id);

        expect(idxA).toBeGreaterThan(-1);
        expect(idxTwin).toBeGreaterThan(-1);

        // Score should be strictly equal
        expect(results[idxA].scoreBreakdown?.finalScore).toBeCloseTo(results[idxTwin].scoreBreakdown?.finalScore || 0, 5);

        // Ascending listingId check
        const id1 = results[Math.min(idxA, idxTwin)].listingId;
        const id2 = results[Math.max(idxA, idxTwin)].listingId;
        expect(id1.localeCompare(id2)).toBeLessThanOrEqual(0);
    });

    it('should write DiscoveryImpressions accurately', async () => {
        const { results } = await rankNetworkListings({
            viewerTenantId: viewerCompanyId,
            filters: { sellerTierMin: 'A' },
            sortMode: 'RELEVANCE'
        });

        // Wait a tick for async logging to complete
        await new Promise(r => setTimeout(r, 1000));

        const impressions = await prisma.discoveryImpression.findMany({
            where: { viewerTenantId: viewerCompanyId, listingId: listingAId }
        });

        expect(impressions.length).toBeGreaterThan(0);
        expect(impressions[0].position).toBeGreaterThanOrEqual(1);
        expect(impressions[0].score.toNumber()).toBeGreaterThan(0);
    });
});
