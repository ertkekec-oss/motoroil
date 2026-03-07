// test_network_trust.ts
import prisma from '../src/lib/prisma';
import { recalculateNetworkTrustScore } from '../src/services/network/trust/score';
import { verifyCompany, restrictCompany, suspendRelationship } from '../src/services/network/trust/admin';

async function runTrustSmokeTest() {
    console.log("=== NETWORK TRUST ENGINE SMOKE TEST ===");

    // Find a network profile
    let profile = await prisma.networkCompanyProfile.findFirst({
        include: { trustScore: true, tenant: true }
    });

    if (!profile) {
        console.log("No Network profile found. Creating a dummy tenant and profile...");
        const tenant = await prisma.tenant.create({
            data: {
                name: 'Test Tenant',
                ownerEmail: 'test@example.com',
                phone: '123'
            }
        });
        profile = await prisma.networkCompanyProfile.create({
            data: {
                tenantId: tenant.id,
                slug: 'test-tenant',
                displayName: 'Test Company',
                visibilityLevel: 'PUBLIC',
                isDiscoveryEnabled: true
            },
            include: { trustScore: true, tenant: true }
        });
    }

    console.log(`Testing Profile: ${profile.displayName} [${profile.tenantId}]`);

    // 1) Test Profile Completeness and Recalculate Trust
    console.log("\n[1] Recalculating Trust Score...");
    const initialScore = await recalculateNetworkTrustScore(profile.id);
    console.log(`Initial Score: ${initialScore.score}`);
    console.log(`Badge: ${initialScore.badge}`);

    // Update Profile to add more completion
    await prisma.networkCompanyProfile.update({
        where: { id: profile.id },
        data: {
            longDescription: "Updated long description for better completion.",
            website: "https://example.com"
        }
    });

    // 2) Verify Company (Admin)
    console.log("\n[2] Verifying Company...");
    const verifiedProfile = await verifyCompany(profile.id);
    console.log(`Verification Status: ${verifiedProfile.verificationStatus}`);

    // Fetch updated trust score
    const verifScore = await recalculateNetworkTrustScore(profile.id);
    console.log(`Score after verify: ${verifScore.score}`);
    console.log(`Badge after verify: ${verifScore.badge}`);

    // 3) Restrict Company
    console.log("\n[3] Restricting Company...");
    const restrictedProfile = await restrictCompany(profile.id);
    console.log(`Verification Status: ${restrictedProfile.verificationStatus}`);
    console.log(`Is Discovery Enabled: ${restrictedProfile.isDiscoveryEnabled}`);

    // 4) Check Discover API 
    console.log("\n[4] Smoke Test Completed DB Operations.");
    console.log("Check the Frontend Discover Page and Profile Pages to see the badges rendering successfully.");
    console.log("=== END OF TEST ===");
}

runTrustSmokeTest()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
