// test_network_recommendation.ts
import prisma from '../src/lib/prisma';
import { discoverSuppliers } from '../src/services/network/discovery/supplierDiscovery';
import { recommendCompaniesForTenant, suggestSuppliersForRFQ } from '../src/services/network/recommendation/engine';
import { calculateNetworkProximity } from '../src/services/network/discovery/proximity';

async function generateTestData() {
    // 1. Create Buyer
    const buyerTenant = await prisma.tenant.create({
        data: { name: 'Smoke Test Buyer', ownerEmail: 'buyer@smoke.test', phone: '111222' }
    });
    const buyerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: buyerTenant.id,
            slug: 'smoke-buyer-' + Date.now(),
            displayName: 'Smoke Test Buyer Inc.',
            visibilityLevel: 'PUBLIC',
            isDiscoveryEnabled: true
        }
    });

    // 2. Create Supplier
    const supplierTenant = await prisma.tenant.create({
        data: { name: 'Smoke Test Supplier', ownerEmail: 'supplier@smoke.test', phone: '333444' }
    });
    const supplierProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: supplierTenant.id,
            slug: 'smoke-supplier-' + Date.now(),
            displayName: 'Smoke Test Supplier LLC',
            visibilityLevel: 'PUBLIC',
            isDiscoveryEnabled: true
        }
    });

    // 3. Add Supplier Capability
    await prisma.networkCapability.create({
        data: {
            profileId: supplierProfile.id,
            categoryId: 'CAT-123',
            capabilityType: 'MANUFACTURER',
            keywords: ['Steel', 'Manufacturing']
        }
    });

    // 4. Give Supplier some trust score
    await prisma.networkTrustScore.create({
        data: {
            tenantId: supplierTenant.id,
            profileId: supplierProfile.id,
            score: 85,
            badge: 'TRUSTED_PARTNER'
        }
    });

    return { buyer: buyerProfile, supplier: supplierProfile };
}

async function runRecommendationSmokeTest() {
    console.log("=== NETWORK RECOMMENDATION ENGINE SMOKE TEST ===");

    // 0. Setup
    console.log("Setting up test data...");
    const { buyer, supplier } = await generateTestData();

    // 1️⃣ Test Proximity
    console.log("\n[1] Testing Proximity Score...");
    const proximity = await calculateNetworkProximity(buyer.tenantId, supplier.tenantId);
    console.log(`Proximity Score (Buyer -> Supplier): ${proximity}`);

    // 2️⃣ Test Supplier Discovery
    console.log("\n[2] Testing Supplier Discovery Engine...");
    const discoverResults = await discoverSuppliers(buyer.tenantId, {
        capabilityType: 'MANUFACTURER'
    });
    console.log(`Discovered ${discoverResults.length} suppliers matching MANUFACTURER type.`);
    if (discoverResults.length > 0) {
        console.log(`Top Supplier Name: ${discoverResults[0].displayName}`);
        console.log(`Discovery Score: ${discoverResults[0].discoveryScore}`);
    }

    // 3️⃣ Test Recommendation List Formation
    console.log("\n[3] Testing Recommendation List Formation...");
    const recommendations = await recommendCompaniesForTenant(buyer.tenantId);
    console.log(`Generated ${recommendations.length} recommendations for Buyer.`);
    if (recommendations.length > 0) {
        const topRec = recommendations[0];
        console.log(`Recommended Profile: ${topRec.targetProfile.displayName}`);
        console.log(`Match Type: ${topRec.recommendationType}`);
        console.log(`Match Reason: ${topRec.reason}`);
    }

    // 4️⃣ Test RFQ Suggestion
    console.log("\n[4] Testing RFQ Supplier Suggestion (Mock)...");
    const rfqSuppliers = await suggestSuppliersForRFQ('mock-rfq-abc');
    console.log(`Suggested RFQ Suppliers returned list length: ${rfqSuppliers.length}`);

    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

runRecommendationSmokeTest()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
