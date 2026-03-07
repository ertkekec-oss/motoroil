// test_network_inventory.ts
import prisma from '../src/lib/prisma';
import { detectOverstockSignals } from '../src/services/network/inventory/overstockDetection';
import { detectStockoutSignals } from '../src/services/network/inventory/stockoutDetection';
import { detectDemandSignals } from '../src/services/network/inventory/demandSignal';
import { generateTradeOpportunities } from '../src/services/network/inventory/opportunityEngine';
import { generateAutoRFQ } from '../src/services/network/inventory/rfqDraftEngine';

async function generateTestData() {
    // 1. Create Buyer
    const buyerTenant = await prisma.tenant.create({ data: { name: 'Inventory Test Buyer', ownerEmail: `buyer_${Date.now()}@test.com`, phone: '123' } });
    const buyerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: buyerTenant.id,
            slug: 'inv-buyer-' + Date.now(),
            displayName: 'Inventory Test Buyer Inc.',
            visibilityLevel: 'PUBLIC',
            isDiscoveryEnabled: true
        }
    });

    // 2. Create Supplier
    const sellerTenant = await prisma.tenant.create({ data: { name: 'Inventory Test Supplier', ownerEmail: `supplier_${Date.now()}@test.com`, phone: '456' } });
    const sellerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: sellerTenant.id,
            slug: 'inv-supplier-' + Date.now(),
            displayName: 'Inventory Test Supplier LLC',
            visibilityLevel: 'PUBLIC',
            isDiscoveryEnabled: true
        }
    });

    // Give them a trust score
    await prisma.networkTrustScore.create({
        data: {
            tenantId: sellerTenant.id,
            profileId: sellerProfile.id,
            score: 95,
            badge: 'TRUSTED_PARTNER'
        }
    });

    return { buyer: buyerTenant, seller: sellerTenant };
}

async function runInventorySmokeTest() {
    console.log("=== INVENTORY INTELLIGENCE ENGINE SMOKE TEST ===");

    // 0. Setup
    console.log("Setting up test data...");
    const { buyer, seller } = await generateTestData();

    // 1️⃣ Test Overstock Detection (Supplier)
    console.log(`\n[1] Testing Overstock Detection for Supplier (${seller.id})...`);
    const overstocks = await detectOverstockSignals(seller.id);
    console.log(`Detected ${overstocks.length} Overstock signals.`);

    // 2️⃣ Test Stockout Detection (Buyer)
    console.log(`\n[2] Testing Stockout Risk Detection for Buyer (${buyer.id})...`);
    const stockouts = await detectStockoutSignals(buyer.id);
    console.log(`Detected ${stockouts.length} Stockout Risk signals.`);

    // 3️⃣ Test Demand Signals (Buyer)
    console.log(`\n[3] Testing Demand Signals for Buyer (${buyer.id})...`);
    const demands = await detectDemandSignals(buyer.id);
    console.log(`Detected ${demands.length} Demand signals.`);

    // 4️⃣ Test Trade Opportunity Generation
    console.log("\n[4] Generating Trade Opportunities...");
    const oppCount = await generateTradeOpportunities();
    console.log(`Generated ${oppCount} Trade Opportunities.`);

    // 5️⃣ Test Auto RFQ Draft
    console.log("\n[5] Testing Auto RFQ Draft Proposal...");

    // Find an opportunity
    const opp = await prisma.networkTradeOpportunity.findFirst({
        where: {
            // Find one we just generated ideally
            buyerProfile: { tenantId: buyer.id },
            supplierProfile: { tenantId: seller.id }
        }
    });

    if (opp) {
        console.log(`Found matching opportunity: ${opp.id}. Attempting RFQ Gen...`);
        const rfqDraft = await generateAutoRFQ(opp.id, buyer.id);
        console.log("RFQ Draft payload generated successfully:");
        console.dir(rfqDraft.draft);
    } else {
        console.log("No matching opportunity found to formulate auto RFQ.");
    }

    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

runInventorySmokeTest()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
