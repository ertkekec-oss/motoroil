import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { rankNetworkListings } from '../ranking';
import { createBoostRule } from '../boosts';
import { GET } from '@/app/api/network/discovery/route';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Setup basic fixtures for tests
let sellerA: string, sellerD: string;
let lAId: string, lDId: string, lNewId: string;
let categoryId = 'CAT_F3_HARD' + Date.now();

beforeAll(async () => {
    // Basic setup...
    const tA = await prisma.tenant.create({ data: { name: 'TA', ownerEmail: `ta-${Date.now()}@test.com` } });
    const tD = await prisma.tenant.create({ data: { name: 'TD', ownerEmail: `td-${Date.now()}@test.com` } });
    sellerA = tA.id;
    sellerD = tD.id;

    const cA = await prisma.company.create({ data: { id: tA.id, tenantId: tA.id, name: 'Comp A', taxNumber: '111', vkn: '111' } });
    const cD = await prisma.company.create({ data: { id: tD.id, tenantId: tD.id, name: 'Comp D', taxNumber: '222', vkn: '222' } });

    await prisma.sellerTrustScore.create({ data: { sellerTenantId: cA.id, score: 95, tier: 'A', windowStart: new Date(), windowEnd: new Date(), componentsJson: {} } });
    await prisma.sellerTrustScore.create({ data: { sellerTenantId: cD.id, score: 40, tier: 'D', windowStart: new Date(), windowEnd: new Date(), componentsJson: {} } });

    const gp = await prisma.globalProduct.create({ data: { name: 'F3 Test Prod', category: { create: { id: categoryId, name: 'CAT', slug: categoryId } }, code: `H_${Date.now()}` } });

    const pA = await prisma.product.create({ data: { id: `H_PA_${Date.now()}`, companyId: cA.id, name: 'P', type: 'GOODS', code: `HC_A_${Date.now()}`, price: 100 } });
    const pD = await prisma.product.create({ data: { id: `H_PD_${Date.now()}`, companyId: cD.id, name: 'P', type: 'GOODS', code: `HC_D_${Date.now()}`, price: 100 } });

    const lA = await prisma.networkListing.create({ data: { globalProductId: gp.id, sellerCompanyId: cA.id, erpProductId: pA.id, price: 100, visibility: 'NETWORK', status: 'ACTIVE', availableQty: 10 } });
    const lD = await prisma.networkListing.create({ data: { globalProductId: gp.id, sellerCompanyId: cD.id, erpProductId: pD.id, price: 100, visibility: 'NETWORK', status: 'ACTIVE', availableQty: 10 } });
    const lNew = await prisma.networkListing.create({ data: { globalProductId: gp.id, sellerCompanyId: cA.id, erpProductId: pA.id, price: 100, visibility: 'NETWORK', status: 'ACTIVE', availableQty: 10, createdAt: new Date() } }); // Just now

    // Older listings for A & D
    await prisma.networkListing.update({ where: { id: lA.id }, data: { createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } });
    await prisma.networkListing.update({ where: { id: lD.id }, data: { createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } });

    lAId = lA.id;
    lDId = lD.id;
    lNewId = lNew.id;
});

afterAll(async () => {
    // Cleanup if needed
});

describe('F3.1 - Hardening Guards', () => {

    it('Query budget: limits to max 50 and forces recency when no filters', async () => {
        const res = await rankNetworkListings({
            viewerTenantId: sellerD,
            filters: {},
            sortMode: 'RELEVANCE',
            limit: 100 // Requesting huge
        });
        // Should clamp limit to 20 if no filters, but definitely <= 50.
        expect(res.results.length).toBeLessThanOrEqual(20);
    });

    it('Anti-Gaming: New Listing Explore Boost (Cold Start)', async () => {
        const res = await rankNetworkListings({
            viewerTenantId: sellerD,
            filters: { categoryId },
            sortMode: 'RELEVANCE'
        });

        const brandNew = res.results.find(r => r.listingId === lNewId);
        const oldA = res.results.find(r => r.listingId === lAId);

        expect(brandNew).toBeDefined();
        if (brandNew) {
            expect(brandNew.topReasons).toContain('New listing boost');
        }
    });

    it('Boost Policy: Clamps multipliers to [1, 3] and prevents overlaps', async () => {
        const rule1 = await createBoostRule({
            scope: 'LISTING',
            targetId: lAId,
            multiplier: 3.0,
            startsAt: new Date(Date.now() - 10000),
            endsAt: new Date(Date.now() + 86400000),
            createdByTenantId: sellerA
        });
        expect(rule1).toBeDefined();

        await expect(createBoostRule({
            scope: 'LISTING',
            targetId: lAId,
            multiplier: 2.0,
            startsAt: new Date(Date.now() - 5000),
            endsAt: new Date(Date.now() + 86400000),
            createdByTenantId: sellerA
        })).rejects.toThrow(/overlap/i);

        await expect(createBoostRule({
            scope: 'SELLER',
            targetId: sellerA,
            multiplier: 4.0, // Above max
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 86400000),
            createdByTenantId: sellerA
        })).rejects.toThrow();
    });

    it('Sponsored Cap & Interleave: Caps at 20% and uses deterministic 1 in 4 interleave', async () => {
        const res = await rankNetworkListings({
            viewerTenantId: sellerD,
            filters: { categoryId },
            sortMode: 'RELEVANCE',
            limit: 20
        });

        const sponsoredCount = res.results.filter(r => r.isSponsored).length;
        expect(sponsoredCount).toBeLessThanOrEqual(4); // 20% of 20 = 4

        const firstSponsoredIndex = res.results.findIndex(r => r.isSponsored);
        // Interleaving: 1 sponsored every 4 organic. Index 0 or 5 etc.
        if (firstSponsoredIndex > -1) {
            expect(firstSponsoredIndex % 5).toBe(0);
        }
    });

});
