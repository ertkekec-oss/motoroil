import { generateTenantMarketInsights } from '../src/services/network/market/tenantInsights';
import prisma from '../src/lib/prisma';
import { NetworkMarketSignalType, NetworkMarketSignalScopeType, NetworkTrendDirection } from '@prisma/client';

async function testTenantInsights() {
    console.log("=== TENANT MARKET INSIGHT TEST ===");

    const mockTenantId = `test-tenant-${Date.now()}`;
    const mockProfileId = `test-prof-${Date.now()}`;
    const mockCategoryId = `test-cat-${Date.now()}`;

    // Setup Mock Tenant and Profile
    const t = await prisma.tenant.create({
        data: { id: mockTenantId, name: 'SigTest', ownerEmail: 'test@s.com', phone: '123' }
    });
    const p = await prisma.networkCompanyProfile.create({
        data: { id: mockProfileId, tenantId: t.id, slug: mockProfileId, displayName: 'ST', isPublicListingEnabled: false }
    });

    console.log("Creating strict Mock Market Signal...");
    // Create an active DEMAND_SPIKE signal
    await prisma.networkMarketSignal.create({
        data: {
            signalScopeType: 'CATEGORY' as NetworkMarketSignalScopeType,
            categoryId: mockCategoryId,
            signalType: 'DEMAND_SPIKE' as NetworkMarketSignalType,
            intensityScore: 85,
            confidenceScore: 90,
            trendDirection: 'UP' as NetworkTrendDirection,
            signalSummary: 'High demand in this category',
            status: 'ACTIVE',
            isStale: false
        }
    });

    console.log("Running Insight Generator for tenant...");
    const insights = await generateTenantMarketInsights(t.id);

    console.log("Generated Insights Count:", insights.length);
    if (insights.length !== 1) throw new Error("Expected exactly 1 insight");

    const insight = insights[0];
    console.log(`Insight Type: ${insight.insightType}`);
    console.log(`Action: ${insight.recommendedAction}`);

    if (insight.insightType !== 'SELL_OPPORTUNITY') throw new Error("Wrong insight type generated");

    console.log("SUCCESS!");
    process.exit(0);
}

testTenantInsights().catch(console.error);
