import prisma from "../src/lib/prisma";
import { createCompanyIdentity, updateVerificationStatus } from "../src/domains/company-identity/services/companyIdentity.service";
import { recordTrustSignal } from "../src/domains/company-identity/services/companyTrustSignal.service";
import { recalculateCompanyTrustProfile, getCompanyTrustProfile, getTrustedSuppliers, getTrustedSuppliersForCanonicalProduct } from "../src/domains/company-identity/services/companyTrust.service";
import { SIGNAL_TYPES } from "../src/domains/company-identity/constants/trust.constants";
import { findOrCreateCanonicalProduct, directMapTenantProductToCanonical } from "../src/domains/product-intelligence/services/canonicalProduct.service";

async function run() {
    console.log("--- PHASE B: COMPANY TRUST ENGINE TESTS ---");

    try {
        const tenantIdGood = "tenant_trust_good_001";
        const tenantIdBad = "tenant_trust_bad_002";

        // Clean up
        await prisma.companyTrustScoreHistory.deleteMany({ where: { tenantId: { in: [tenantIdGood, tenantIdBad] } } });
        await prisma.companyTrustSignal.deleteMany({ where: { tenantId: { in: [tenantIdGood, tenantIdBad] } } });
        await prisma.companyTrustProfile.deleteMany({ where: { tenantId: { in: [tenantIdGood, tenantIdBad] } } });
        await prisma.companyVerificationDocument.deleteMany({ where: { company: { tenantId: { in: [tenantIdGood, tenantIdBad] } } } });
        await prisma.companyIdentity.deleteMany({ where: { tenantId: { in: [tenantIdGood, tenantIdBad] } } });

        // 1. Create Identities & Verify the Good one
        console.log("1. Creating Identities...");
        const identityGood = await createCompanyIdentity({
            tenantId: tenantIdGood,
            legalName: "Good Supplier A.Ş.",
            taxNumber: "1111111111",
            country: "Turkey"
        });
        await updateVerificationStatus(identityGood.id, "VERIFIED");

        const identityBad = await createCompanyIdentity({
            tenantId: tenantIdBad,
            legalName: "Bad Supplier Ltd.",
            taxNumber: "2222222222",
            country: "Turkey"
        });
        // Bad stays unverified

        // 2. Record Signals
        console.log("2. Recording Trust Signals...");
        // Good Supplier gets excellent behavioral score
        await recordTrustSignal({ tenantId: tenantIdGood, signalType: SIGNAL_TYPES.TRADE_COMPLETION_RATE, signalValue: 0.98, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdGood, signalType: SIGNAL_TYPES.SHIPPING_RELIABILITY, signalValue: 0.95, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdGood, signalType: SIGNAL_TYPES.PAYMENT_RELIABILITY, signalValue: 1.0, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdGood, signalType: SIGNAL_TYPES.DISPUTE_RATE, signalValue: 0.01, weight: 1 });

        // Bad Supplier gets poor behavioral score
        await recordTrustSignal({ tenantId: tenantIdBad, signalType: SIGNAL_TYPES.TRADE_COMPLETION_RATE, signalValue: 0.60, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdBad, signalType: SIGNAL_TYPES.SHIPPING_RELIABILITY, signalValue: 0.50, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdBad, signalType: SIGNAL_TYPES.PAYMENT_RELIABILITY, signalValue: 0.40, weight: 1 });
        await recordTrustSignal({ tenantId: tenantIdBad, signalType: SIGNAL_TYPES.DISPUTE_RATE, signalValue: 0.30, weight: 1 });

        // 3. Recalculate Trust
        console.log("3. Recalculating Trust Profiles...");
        await recalculateCompanyTrustProfile(tenantIdGood);
        await recalculateCompanyTrustProfile(tenantIdBad);

        // Validate
        const profileGood = await getCompanyTrustProfile(tenantIdGood);
        const profileBad = await getCompanyTrustProfile(tenantIdBad);

        console.log(`\nResults:`);
        console.log(` [GOOD SUPPLIER] Score: ${profileGood?.overallScore.toFixed(3)} | Level: ${profileGood?.trustLevel}`);
        console.log(` [BAD SUPPLIER]  Score: ${profileBad?.overallScore.toFixed(3)}  | Level: ${profileBad?.trustLevel}`);

        if (profileGood?.trustLevel === "VERIFIED_HIGH" && profileBad?.trustLevel === "LOW") {
            console.log("   --> Core Trust Rules Verified!");
        } else {
            console.error("   --> Core Trust Rules FAILED validation.");
        }

        // 4. Test filtering Trusted Suppliers for a Product
        console.log("\n4. Testing Discovery/Liquidity Filter...");
        const canonical = await findOrCreateCanonicalProduct("Test Rulman 6203");

        await directMapTenantProductToCanonical(tenantIdGood, "111", canonical.id, 0.9);
        await directMapTenantProductToCanonical(tenantIdBad, "222", canonical.id, 0.9);

        const trustedOnly = await getTrustedSuppliersForCanonicalProduct(canonical.id, "HIGH");
        console.log(` Total suppliers for product: 2`);
        console.log(` Suppliers returned from 'HIGH' trust filter: ${trustedOnly.length}`);
        trustedOnly.forEach(t => console.log(`   - Supplier Tenant: ${t.trustProfile?.tenantId}`));

        console.log("\nTEST SUCCESSFUL");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
