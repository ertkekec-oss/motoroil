import { generateMarketSignals } from '../src/services/network/market/marketSignalEngine';
import prisma from '../src/lib/prisma';

async function testMarketSignals() {
    console.log("=== MARKET SIGNAL ENGINE TEST ===");

    const mockProfileId = `test-prof-${Date.now()}`;
    const mockTenantId = `test-tenant-${Date.now()}`;
    const mockCategoryId = `test-cat-${Date.now()}`;

    // Setup Mock
    const t = await prisma.tenant.create({ data: { id: mockTenantId, name: 'SigTest', ownerEmail: 'test@s.com', phone: '123' } });
    const p = await prisma.networkCompanyProfile.create({ data: { id: mockProfileId, tenantId: t.id, slug: mockProfileId, displayName: 'ST' } });

    console.log(`Setting up mock dummy signals for Category: ${mockCategoryId}`);

    // Create 4 mock demand signals
    for (let i = 0; i < 4; i++) {
        await prisma.networkInventorySignal.create({
            data: {
                tenantId: t.id,
                profileId: p.id,
                productCategoryId: mockCategoryId,
                signalType: 'HIGH_DEMAND',
                quantityBand: 'HIGH',
                velocityScore: 80,
                confidenceScore: 90,
                visibilityScope: 'NETWORK'
            }
        });
    }

    console.log("Running Orchestrator...");
    const rawResult = await generateMarketSignals({ categoryId: mockCategoryId });
    const results = rawResult.result || [];

    console.log("Generated Signals:", results.map((r: any) => r.signalType));

    if (results.length === 0) {
        throw new Error("Failed to generate signals from mock data");
    }

    const demandSignal = results.find((r: any) => r.signalType === 'DEMAND_SPIKE');
    if (!demandSignal) throw new Error("Missing DEMAND_SPIKE signal");

    console.log(`Demand Spike Score: ${demandSignal.intensityScore}`);

    // Idempotency check 
    console.log("Running orchestrator again (Idempotency Check)...");
    const results2 = await generateMarketSignals({ categoryId: mockCategoryId });
    if (!results2.skipped) {
        throw new Error("Idempotency failed. Run was not skipped.");
    }

    console.log("SUCCESS!");
    process.exit(0);
}

testMarketSignals().catch(console.error);
