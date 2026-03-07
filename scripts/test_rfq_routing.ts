import prisma from '../src/lib/prisma';
import { prepareRoutingSession, generateSupplierCandidatesForRFQ, buildRoutingWaves, routeRFQWave } from '../src/services/network/routing/rfqRouting';
import { generateTradeMatchCandidates } from '../src/services/network/routing/aiMatching';
import { upsertRoutingPolicy } from '../src/services/network/routing/policy';

async function generateTestData() {
    // 1. Create Buyer
    const buyerTenant = await prisma.tenant.create({ data: { name: 'Routing Test Buyer', ownerEmail: `buyer_${Date.now()}@test.com`, phone: '123' } });
    const buyerProfile = await prisma.networkCompanyProfile.create({
        data: {
            tenantId: buyerTenant.id,
            slug: 'route-buyer-' + Date.now(),
            displayName: 'Routing Test Buyer Inc.',
            visibilityLevel: 'PUBLIC',
            isDiscoveryEnabled: true
        }
    });

    // 2. Create Suppliers
    const suppliers = [];
    for (let i = 1; i <= 5; i++) {
        const t = await prisma.tenant.create({ data: { name: `Routing Supp ${i}`, ownerEmail: `supp${i}_${Date.now()}@test.com`, phone: '456' } });
        const p = await prisma.networkCompanyProfile.create({
            data: {
                tenantId: t.id,
                slug: `route-sup-${i}-` + Date.now(),
                displayName: `Routing Test Supplier ${i}`,
                visibilityLevel: 'PUBLIC',
                isDiscoveryEnabled: true,
                profileCompleteness: 50 + (i * 10)
            }
        });

        // Some capabilities to match
        await prisma.networkCapability.create({
            data: {
                profileId: p.id,
                capabilityType: 'MANUFACTURER',
                categoryId: 'CAT-TEST',
                metadata: { description: 'Test Category' }
            }
        });

        await prisma.networkTrustScore.create({
            data: {
                tenantId: t.id,
                profileId: p.id,
                score: 40 + (i * 12),
                badge: i > 3 ? 'TRUSTED_PARTNER' : 'UNVERIFIED',
                activityScore: i * 5
            }
        });

        suppliers.push(t);
    }

    return { buyer: buyerTenant, suppliers };
}

async function runRoutingSmokeTest() {
    console.log("=== AUTONOMOUS TRADE ROUTING SMOKE TEST ===");

    console.log("Setting up test data...");
    const { buyer, suppliers } = await generateTestData();

    // Policy Setup
    await upsertRoutingPolicy(buyer.id, {
        autoRoutingEnabled: true,
        maxPrimarySuppliers: 2,
        maxFallbackSuppliers: 3,
        minTrustScore: 50,
        minConfidenceScore: 50,
        allowWaveRouting: true
    });
    console.log("Policy applied.");

    const rfqId = `test-rfq-${Date.now()}`;

    // 1. Prepare Session
    console.log("\n[1] Preparing Routing Session...");
    const session = await prepareRoutingSession(rfqId, buyer.id);
    console.log(`Session Created: ${session.id} (Mode: ${session.routingMode})`);

    // 2. Generate Candidates
    console.log("\n[2] Generating Candidates...");
    const candidatesScored = await generateSupplierCandidatesForRFQ(rfqId, buyer.id, ['CAT-TEST']);
    console.log(`Found and scored ${candidatesScored.length} eligible candidates.`);

    // 3. Build Waves
    console.log("\n[3] Building Routing Waves...");
    const sessionWithWaves = await buildRoutingWaves(session.id);
    console.log(`Waves built. Total Candidates recorded: ${sessionWithWaves.totalCandidates}`);

    const waves = await prisma.rFQRoutingWave.findMany({ where: { sessionId: session.id } });
    console.log(`Created ${waves.length} waves.`);
    waves.forEach(w => console.log(` - Wave ${w.waveNumber}: ${w.plannedSuppliersCount} planned suppliers`));

    // 4. AI Matching Explanations
    console.log("\n[4] Generating AI Explanation Context...");
    const aiMatches = await generateTradeMatchCandidates(rfqId, buyer.id);
    aiMatches.slice(0, 2).forEach((match, i) => {
        console.log(`\nCandidate ${i + 1} (${Math.round(match.totalScore)}% Match):`);
        console.log(` Explanation: ${match.explanation}`);
        console.log(` Tags: ${match.reasonTags.join(', ')}`);
    });

    // 5. Execute Wave
    if (waves.length > 0) {
        console.log(`\n[5] Executing Wave 1...`);
        const resultWave = await routeRFQWave(session.id, 1);
        console.log(`Wave 1 completed. Routed ${resultWave.routedSuppliersCount} suppliers.`);
    }

    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

runRoutingSmokeTest()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test failed:", err);
        process.exit(1);
    });
