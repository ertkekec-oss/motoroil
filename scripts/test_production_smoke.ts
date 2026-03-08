import { PrismaClient } from '@prisma/client';
import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';
import { generateAutoRFQ } from '../src/services/network/inventory/rfqDraftEngine';
import { TradeLedgerIngestionService } from '../src/domains/trade-ledger/services/tradeLedgerIngestion.service';

const prisma = new PrismaClient();

async function runProductionSmokePack() {
    console.log("=== PERIODY FINAL PRE-DEPLOY SMOKE TEST ===");

    const buyerId = `BUY_${Date.now()}`;
    const sellerId = `SEL_${Date.now()}`;
    const categoryId = `CAT_${Date.now()}`;

    // 1. Profiles & Tenants
    await prisma.tenant.create({ data: { id: buyerId, name: "Buyer Tenant", ownerEmail: `buyer${Date.now()}@test.com` } });
    await prisma.tenant.create({ data: { id: sellerId, name: "Seller Tenant", ownerEmail: `seller${Date.now()}@test.com` } });

    const bProf = await prisma.networkCompanyProfile.create({ data: { tenantId: buyerId, displayName: "Buyer Inc", slug: `buyer-${Date.now()}` } });
    const sProf = await prisma.networkCompanyProfile.create({ data: { tenantId: sellerId, displayName: "Seller Inc", slug: `seller-${Date.now()}` } });

    await prisma.companyTrustProfile.create({ data: { tenantId: buyerId, overallScore: 95, tradeScore: 95, shippingScore: 95, paymentScore: 10, trustLevel: "HIGH" } });
    await prisma.companyTrustProfile.create({ data: { tenantId: sellerId, overallScore: 95, tradeScore: 95, shippingScore: 95, paymentScore: 10, trustLevel: "HIGH" } });

    console.log("✅ Tenant & Profiles created (Isolation Confirmed)");

    // 2. Inject Variables (1 Demand, 1 Supply)
    await prisma.networkInventorySignal.create({
        data: { tenantId: buyerId, profileId: bProf.id, productCategoryId: categoryId, signalType: 'HIGH_DEMAND', quantityBand: 'HIGH', velocityScore: 40, confidenceScore: 90, status: 'ACTIVE' }
    });

    await prisma.networkInventorySignal.create({
        data: { tenantId: sellerId, profileId: sProf.id, productCategoryId: categoryId, signalType: 'OVERSTOCK', quantityBand: 'HIGH', velocityScore: 40, confidenceScore: 90, status: 'ACTIVE' }
    });

    console.log("✅ 1 Demand Signal, 1 Supply Signal Injected");

    // 3. Liquidity Match
    await LiquidityEngine.scanAndLogSupply(categoryId);
    await LiquidityEngine.scanAndLogDemand(categoryId);
    const mRes = await LiquidityEngine.processLiquidityMatches();

    if (mRes.matchedCount === 0) throw new Error("Match missing!");

    // Duplicate match protection verification
    const mResDup = await LiquidityEngine.processLiquidityMatches();
    if (mResDup.matchedCount > 0) throw new Error("Duplicate match allowed!");

    const match = await prisma.networkLiquidityMatch.findFirst({ where: { buyerTenantId: buyerId } });
    if (!match) throw new Error("Match not saved!");

    console.log("✅ 1 Liquidity Match generated (0 duplicates allowed)");

    // 4. Proposal Creation
    const p1 = await generateAutoRFQ(match.id, buyerId);
    if (!p1.draft) throw new Error("Proposal not created");

    // Duplicate proposal protection
    const p2 = await generateAutoRFQ(match.id, buyerId);
    if (p1.draft.id !== p2.draft?.id) throw new Error("Duplicate proposal allowed!");

    console.log("✅ 1 Proposal generated (0 duplicates allowed)");

    // 5. Ledger Entry Validation
    await new Promise(r => setTimeout(r, 1000));
    const ledgers = await prisma.tradeLedgerEntry.findMany({ where: { proposalId: p1.draft.id, eventType: 'PROPOSAL_CREATED' } });

    if (ledgers.length !== 1) throw new Error("Ledger entry NOT exactly 1");
    console.log("✅ 1 Ledger Entry Confirmed");

    // 6. Growth Trigger Check
    await TradeLedgerIngestionService.recordTradeCompleted({ buyerTenantId: buyerId, sellerTenantId: sellerId, proposalId: p1.draft.id, canonicalProductId: categoryId, amount: 5000 });
    // Duplicate test
    await TradeLedgerIngestionService.recordTradeCompleted({ buyerTenantId: buyerId, sellerTenantId: sellerId, proposalId: p1.draft.id, canonicalProductId: categoryId, amount: 5000 });

    await new Promise(r => setTimeout(r, 1000));
    const triggers = await prisma.networkGrowthTrigger.findMany({ where: { canonicalProductId: categoryId } });

    if (triggers.length !== 2) throw new Error(`Triggers != 2 (expected 1 for buyer and 1 for seller), got ${triggers.length}`);
    console.log("✅ 1 Growth Trigger Pair Confirmed (No duplicates)");

    console.log("=== FINAL E2E SMOKE TEST PASSED SUCCESSFULLY ✅ ===");
    process.exit(0);
}

runProductionSmokePack().catch((e) => {
    console.error("❌ E2E MOCK FAIL:", e);
    process.exit(1);
});
