import { PrismaClient, NetworkInventorySignalType } from '@prisma/client';
import { detectOverstockSignals } from '../src/services/network/inventory/overstockDetection';
import { detectDemandSignals } from '../src/services/network/inventory/demandSignal';
import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';
import { generateAutoRFQ } from '../src/services/network/inventory/rfqDraftEngine';

const prisma = new PrismaClient();

async function runAutonomousTradeLoop() {
    console.log("=== Autonomous Trade Generation Loop Completion Test ===");

    // 1. Prepare Tenant and Company Profiles
    const buyerTenantId = `BUYER_TENANT_${Date.now()}`;
    const sellerTenantId = `SELLER_TENANT_${Date.now()}`;

    console.log("Creating Test Profiles... buyer:", buyerTenantId, "seller:", sellerTenantId);

    // Profiles
    await prisma.tenant.create({
        data: { id: buyerTenantId, name: "Test Buyer Tenant", ownerEmail: "buyer@test.com" }
    });

    await prisma.tenant.create({
        data: { id: sellerTenantId, name: "Test Seller Tenant", ownerEmail: "seller@test.com" }
    });

    const buyerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: buyerTenantId,
            displayName: "Test Buyer Inc.",
            slug: `buyer-inc-${Date.now()}`
        }
    });

    const sellerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: sellerTenantId,
            displayName: "Test Supplier Co.",
            slug: `seller-co-${Date.now()}`
        }
    });

    // Company Trust Profiles
    await prisma.companyTrustProfile.create({
        data: {
            tenantId: buyerTenantId,
            overallScore: 92,
            tradeScore: 88,
            shippingScore: 95,
            paymentScore: 10,
            trustLevel: "HIGH"
        }
    });

    await prisma.companyTrustProfile.create({
        data: {
            tenantId: sellerTenantId,
            overallScore: 85,
            tradeScore: 82,
            shippingScore: 80,
            paymentScore: 20,
            trustLevel: "MEDIUM" // Trust Filter should let this pass
        }
    });

    // 2. Mock "Real" Signal Injection via ERP detector simulation
    console.log("Injecting Inventory Signals into DB...");
    const category = `CAT_TEST_${Date.now()}`;

    await prisma.networkInventorySignal.create({
        data: {
            tenantId: buyerTenantId,
            profileId: buyerProfile.id,
            productCategoryId: category,
            signalType: 'HIGH_DEMAND',
            quantityBand: 'HIGH',
            velocityScore: 40,
            confidenceScore: 90,
            status: 'ACTIVE'
        }
    });

    await prisma.networkInventorySignal.create({
        data: {
            tenantId: sellerTenantId,
            profileId: sellerProfile.id,
            productCategoryId: category,
            signalType: 'OVERSTOCK',
            quantityBand: 'HIGH',
            velocityScore: 30,
            confidenceScore: 80,
            status: 'ACTIVE'
        }
    });

    // 3. Liquidity Engine Pipeline
    console.log("Running Liquidity Engine Scan...");
    await LiquidityEngine.scanAndLogSupply(category);
    await LiquidityEngine.scanAndLogDemand(category);

    console.log("Processing Matches...");
    const matchResult = await LiquidityEngine.processLiquidityMatches();
    console.log(`Matched Count: ${matchResult.matchedCount}`);

    // Verify Match object
    const match = await prisma.networkLiquidityMatch.findFirst({
        where: { buyerTenantId, sellerTenantId, categoryId: category }
    });

    if (!match) {
        throw new Error("Match not generated!");
    } else {
        console.log(`Liquidity Match ID: ${match.id} (Score: ${match.finalMatchScore})`);
    }

    // 4. Trigger Auto RFQ Action
    console.log("Triggering Auto RFQ Action from Match...");
    const result = await generateAutoRFQ(match.id, buyerTenantId);

    if (result.success && result.draft) {
        console.log(`Successfully generated Trade Proposal via Action: ${result.draft.id}`);
        console.log(`Proposal status: ${(result.draft as any).status}`);
    }

    console.log("Verifying Proposal persistence...");
    const proposal = await prisma.networkTradeProposal.findFirst({
        where: { liquidityMatchId: match.id }
    });

    if (!proposal) {
        throw new Error("Trade Proposal was NOT persisted!");
    } else {
        console.log("Proposal successfully linked and persisted. End-to-end loop OK!");
    }

    console.log("=== Test Complete - Passed ✅ ===");
    process.exit(0);
}

runAutonomousTradeLoop().catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
});
