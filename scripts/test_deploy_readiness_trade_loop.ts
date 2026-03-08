import { PrismaClient } from '@prisma/client';
import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';
import { generateAutoRFQ } from '../src/services/network/inventory/rfqDraftEngine';
import { TradeLedgerIngestionService } from '../src/domains/trade-ledger/services/tradeLedgerIngestion.service';
import { ProposalEngine } from '../src/services/network/tradeExecution/proposalEngine';

const prisma = new PrismaClient();

async function runDeploySmokePack() {
    console.log("=== Autonomous Trade Loop Deploy Readiness & Idempotency Smoke Pack ===");

    const buyerId = `BUYER_${Date.now()}`;
    const sellerId = `SELLER_${Date.now()}`;
    const categoryId = `CAT_${Date.now()}`;

    // Profiles
    await prisma.tenant.create({ data: { id: buyerId, name: "Buyer", ownerEmail: "buyer@test.com" } });
    await prisma.tenant.create({ data: { id: sellerId, name: "Seller", ownerEmail: "seller@test.com" } });
    const bProf = await prisma.networkCompanyProfile.create({ data: { tenantId: buyerId, displayName: "Buyer", slug: `b-${Date.now()}` } });
    const sProf = await prisma.networkCompanyProfile.create({ data: { tenantId: sellerId, displayName: "Seller", slug: `s-${Date.now()}` } });

    await prisma.companyTrustProfile.create({ data: { tenantId: buyerId, overallScore: 90, tradeScore: 90, shippingScore: 90, paymentScore: 10, trustLevel: "HIGH" } });
    await prisma.companyTrustProfile.create({ data: { tenantId: sellerId, overallScore: 90, tradeScore: 90, shippingScore: 90, paymentScore: 10, trustLevel: "HIGH" } });

    // Inject Signals
    await prisma.networkInventorySignal.create({
        data: { tenantId: buyerId, profileId: bProf.id, productCategoryId: categoryId, signalType: 'HIGH_DEMAND', quantityBand: 'HIGH', velocityScore: 40, confidenceScore: 90, status: 'ACTIVE' }
    });
    await prisma.networkInventorySignal.create({
        data: { tenantId: sellerId, profileId: sProf.id, productCategoryId: categoryId, signalType: 'OVERSTOCK', quantityBand: 'HIGH', velocityScore: 40, confidenceScore: 90, status: 'ACTIVE' }
    });

    console.log("[1] Testing Liquidity Generation and Deduplication...");
    await LiquidityEngine.scanAndLogSupply(categoryId);
    await LiquidityEngine.scanAndLogDemand(categoryId);
    const mRes1 = await LiquidityEngine.processLiquidityMatches();
    console.log(` -> First Pass Matched: ${mRes1.matchedCount}`);

    // Test Deduplication Race
    const mRes2 = await LiquidityEngine.processLiquidityMatches();
    console.log(` -> Second Pass Matched (Should be 0): ${mRes2.matchedCount}`);
    if (mRes2.matchedCount > 0) throw new Error("Duplicate match generated!");

    const match = await prisma.networkLiquidityMatch.findFirst({ where: { buyerTenantId: buyerId } });
    if (!match) throw new Error("Match missing");

    console.log("[2] Testing Proposal Engine Race Condition & Idempotency...");
    const p1 = await generateAutoRFQ(match.id, buyerId);
    console.log(` -> P1 Created: ${p1.draft?.id}`);

    const p2 = await generateAutoRFQ(match.id, buyerId);
    console.log(` -> P2 Attempted: ${p2.draft?.id}`);

    if (p1.draft?.id !== p2.draft?.id) {
        throw new Error("Duplicate proposal generated against idempotency rules!");
    }

    console.log("[3] Testing Ledger Append-Only Deduplication...");
    await new Promise(r => setTimeout(r, 1000));

    const ledgers = await prisma.tradeLedgerEntry.findMany({ where: { proposalId: p1.draft!.id, eventType: 'PROPOSAL_CREATED' } });
    console.log(` -> Ledger events for Proposal: ${ledgers.length} (Should be 1)`);
    if (ledgers.length !== 1) throw new Error("Duplicate or missing ledger entry!");

    console.log("[4] Testing Growth Engine Trigger Deduplication...");
    await TradeLedgerIngestionService.recordTradeCompleted({ buyerTenantId: buyerId, sellerTenantId: sellerId, proposalId: p1.draft!.id, canonicalProductId: categoryId, amount: 1000 });
    await TradeLedgerIngestionService.recordTradeCompleted({ buyerTenantId: buyerId, sellerTenantId: sellerId, proposalId: p1.draft!.id, canonicalProductId: categoryId, amount: 1000 });

    await new Promise(r => setTimeout(r, 1000));

    const triggers = await prisma.networkGrowthTrigger.findMany({ where: { canonicalProductId: categoryId } });
    console.log(` -> Triggers created: ${triggers.length}`);

    // Expect 2 triggers (1 buyer exp, 1 seller exp) since both were triggered at same time, but 2 calls shouldn't produce 4
    if (triggers.length !== 2) throw new Error(`Expected 2 triggers, got ${triggers.length}`);

    console.log("=== All Deploy Readiness Smoke Tests Passed ✅ ===");
    process.exit(0);
}

runDeploySmokePack().catch((e) => {
    console.error("Test Error:", e);
    process.exit(1);
});
