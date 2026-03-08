import prisma from "@/lib/prisma";
import { getOrCreateTrustProfile, recalculateCompanyTrustProfile } from "@/domains/company-identity/services/companyTrust.service";
import { buildTenantTrustPresentation } from "@/domains/company-identity/utils/trustPresentation";
import { submitTrustScoreRecalc } from "@/services/finance/trust/recalcWorker";

async function runTest() {
    console.log("--- TRUST SCORE UNIFICATION TEST ---");

    try {
        const tenantId = "tenant_unification_test";

        // 1. Cleanup
        await prisma.companyTrustProfile.deleteMany({ where: { tenantId } });
        await prisma.sellerTrustScore.deleteMany({ where: { sellerTenantId: tenantId } });
        await prisma.trustScoreRecalcJob.deleteMany({ where: { sellerTenantId: tenantId } });
        await prisma.companyTrustSignal.deleteMany({ where: { tenantId } });
        await prisma.companyIdentity.deleteMany({ where: { tenantId } });
        await prisma.company.deleteMany({ where: { id: tenantId } });
        await prisma.trustScoreRecalcJob.deleteMany({ where: { sellerTenantId: tenantId } });
        await prisma.companyTrustSignal.deleteMany({ where: { tenantId } });
        await prisma.companyIdentity.deleteMany({ where: { tenantId } });

        // 2. Setup Identity and Profile
        const identity = await prisma.companyIdentity.create({
            data: {
                tenantId,
                legalName: "Unification Test Corp",
                verificationStatus: "VERIFIED",
                taxNumber: "1234567890",
                country: "Turkey"
            }
        });

        console.log("Created Identity.");

        // Add some mock signals so it's not all zeroes
        await prisma.companyTrustSignal.create({
            data: {
                tenantId,
                signalType: "TRADE_COMPLETION_RATE",
                signalValue: 85,
                weight: 0.25,
                sourceRef: "System"
            }
        });

        await prisma.companyTrustSignal.create({
            data: {
                tenantId,
                signalType: "SHIPPING_RELIABILITY",
                signalValue: 90,
                weight: 0.2,
                sourceRef: "System"
            }
        });

        // 3. Trigger recalculate from CompanyTrustEngine
        const profile = await recalculateCompanyTrustProfile(tenantId);
        console.log(`CompanyTrustProfile overallScore: ${profile.overallScore}, trustLevel: ${profile.trustLevel}`);

        // 4. Test Presentation Helper
        const presentation = buildTenantTrustPresentation(profile);
        console.log(`Presentation Output - Score: ${presentation.score100}, Segment: ${presentation.segmentLabel}`);

        console.log("TEST SUCCESSFUL");

    } catch (e: any) {
        console.log("ERROR_MESSAGE:", e.message);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

runTest();
