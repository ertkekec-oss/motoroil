import { PrismaClient } from '@prisma/client';
import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';
import { generateAutoRFQ } from '../src/services/network/inventory/rfqDraftEngine';
import { TradeLedgerIngestionService } from '../src/domains/trade-ledger/services/tradeLedgerIngestion.service';

const prisma = new PrismaClient();

async function runAutonomousTradeLoop() {
    console.log("=== Autonomous Trade Generation Loop Completion Test ===");
    console.log("=== WITH REAL TRADE LEDGER & GROWTH ENGINE ===");

    // 1. Prepare Tenant and Company Profiles
    const buyerTenantId = `BUYER_TENANT_${Date.now()}`;
    const sellerTenantId = `SELLER_TENANT_${Date.now()}`;

    console.log("Creating Test Profiles... buyer:", buyerTenantId, "seller:", sellerTenantId);

    // Profiles
    await prisma.tenant.create({
        data: { id: buyerTenantId, name: "Test Buyer Tenant", ownerEmail: "buyer@test.com" }
    });

    await prisma.tenant.create({
        data: { id: sellerTenantId, name: "Test Supplier Tenant", ownerEmail: "seller@test.com" }
    });

    const buyerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: buyerTenantId,
            displayName: "Test Buyer Inc.",
            slug: `buyer-${Date.now()}`
        }
    });

    const sellerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: sellerTenantId,
            displayName: "Test Supplier Co.",
            slug: `seller-${Date.now()}`
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

    // Since Match Engine hook is async without blocking the response array, we wait briefly for Ledger execution if Node delays it.
    await new Promise(r => setTimeout(r, 1000));

    const matchLedger = await prisma.tradeLedgerEntry.findFirst({
        where: { eventType: 'LIQUIDITY_MATCH_CREATED', buyerTenantId, sellerTenantId }
    });
    if (!matchLedger) throw new Error("LIQUIDITY MATCH was not appended to Trade Ledger!");
    console.log("Trade Ledger: Liquidity Match Entry successful!");

    // 4. Trigger Auto RFQ Action
    console.log("Triggering Auto RFQ Action from Match...");
    const result = await generateAutoRFQ(match.id, buyerTenantId);

    if (result.success && result.draft) {
        console.log(`Successfully generated Trade Proposal via Action: ${result.draft.id}`);
        console.log(`Proposal status: ${(result.draft as any).status}`);
    }

    // 5. Verify Proposal persistence
    console.log("Verifying Proposal persistence...");
    const proposal = await prisma.networkTradeProposal.findFirst({
        where: { liquidityMatchId: match.id }
    });

    if (!proposal) {
        throw new Error("Trade Proposal was NOT persisted!");
    } else {
        console.log(`Proposal successfully linked and persisted: ${proposal.id}`);
    }

    // Wait for ledger write on proposal creation
    await new Promise(r => setTimeout(r, 1000));

    const propLedger = await prisma.tradeLedgerEntry.findFirst({
        where: { eventType: 'PROPOSAL_CREATED', proposalId: proposal.id }
    });
    if (!propLedger) throw new Error("PROPOSAL CREATION was not appended to Trade Ledger!");
    console.log("Trade Ledger: Proposal Entry successful!");

    // 6. Complete the Flow and Trigger Growth Analytics
    console.log("Marking trade as Completed to fire Growth Engine...");
    await TradeLedgerIngestionService.recordTradeCompleted({
        buyerTenantId,
        sellerTenantId,
        proposalId: proposal.id,
        canonicalProductId: category,
        amount: proposal.proposedPriceHigh || 0
    });

    await new Promise(r => setTimeout(r, 1000));

    const tradeLedger = await prisma.tradeLedgerEntry.findFirst({
        where: { eventType: 'TRADE_COMPLETED', proposalId: proposal.id }
    });
    if (!tradeLedger) throw new Error("TRADE_COMPLETED was not appended to Trade Ledger!");
    console.log("Trade Ledger: Trade Completed Entry successful!");

    const growthTriggers = await prisma.networkGrowthTrigger.findMany({
        where: { canonicalProductId: category }
    });

    if (growthTriggers.length === 0) {
        throw new Error("Growth Engine did NOT produce triggers for completed trade!");
    }

    console.log(`Growth Triggers generated: ${growthTriggers.length}`);
    for (const t of growthTriggers) {
        console.log(` - ${t.triggerType}`);
    }

    const triggerIds = growthTriggers.map(t => t.id);
    const growthActions = await prisma.networkGrowthAction.findMany({
        where: { triggerId: { in: triggerIds } }
    });

    if (growthActions.length === 0) {
        throw new Error("Growth Engine did NOT produce actions for triggers!");
    }
    console.log(`Growth Actions generated: ${growthActions.length}`);
    for (const a of growthActions) {
        console.log(` - ${a.actionType} (Status: ${a.status})`);
    }

    console.log("=== Test Complete - All Layers Integrated ✅ ===");
    process.exit(0);
}

runAutonomousTradeLoop().catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
});
