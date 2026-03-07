import prisma from '../src/lib/prisma';
import { getOrCreateNetworkProfile, updateNetworkProfile } from '../src/services/network/engine/profile';
import { sendConnectionInvite, acceptConnectionInvite, rejectConnectionInvite } from '../src/services/network/engine/invitation';
import { listDiscoverableCompanies } from '../src/services/network/engine/discovery';
import { getConnectionDetails } from '../src/services/network/engine/relationship';

async function runSmokeTest() {
    console.log("--- Starting Network Engine Smoke Test ---");

    // 1. Setup 2 Tenants
    const tA = await prisma.tenant.create({ data: { name: 'Tenant A', ownerEmail: 'a@example.com' } });
    const tB = await prisma.tenant.create({ data: { name: 'Tenant B', ownerEmail: 'b@example.com' } });
    const tC = await prisma.tenant.create({ data: { name: 'Tenant C', ownerEmail: 'c@example.com' } });

    console.log(`Created Tenants: A(${tA.id}), B(${tB.id}), C(${tC.id})`);

    // 2. Setup Profiles
    await updateNetworkProfile(tA.id, {
        displayName: 'Company A Ltd',
        legalName: 'Company A Legal',
        isDiscoveryEnabled: true,
        visibilityLevel: 'NETWORK',
        sectors: ['Tech'],
        phone: '+905554443322'
    });

    await updateNetworkProfile(tB.id, {
        displayName: 'Company B Ltd',
        legalName: 'Company B Legal',
        isDiscoveryEnabled: true,
        visibilityLevel: 'NETWORK',
        sectors: ['Logistics'],
        phone: '+905559998877'
    });

    await updateNetworkProfile(tC.id, {
        displayName: 'Company C Ltd',
        legalName: 'Company C Legal',
        isDiscoveryEnabled: false, // Private
        visibilityLevel: 'PRIVATE'
    });

    // 3. Test Discover (Projection Test)
    console.log("\n--- Discover Projection ---");
    const discoverForA = await listDiscoverableCompanies(tA.id, {});
    console.log("Discover result for Tenant A:", JSON.stringify(discoverForA, null, 2));

    let isPrivateLeak = false;
    if (discoverForA.some((p: any) => p.legalName || p.phone)) {
        isPrivateLeak = true;
    }
    console.log("Private Field Leak on Discover?", isPrivateLeak);

    // 4. Test Invitations
    console.log("\n--- Invitations ---");
    // send invite A -> B
    const invite = await sendConnectionInvite(tA.id, {
        toTenantId: tB.id,
        proposedRelationshipType: 'SUPPLIER',
        message: 'Hello let us connect'
    });
    console.log("Sent Invite A -> B:", invite.id);

    // duplicate check
    try {
        await sendConnectionInvite(tA.id, {
            toTenantId: tB.id,
            proposedRelationshipType: 'SUPPLIER'
        });
        console.log("Duplicate allowed? FAILED");
    } catch (e: any) {
        console.log("Duplicate blocked successfully. Error:", e.message);
    }

    // unauthorized accept (C tries to accept A->B invite)
    try {
        await acceptConnectionInvite(tC.id, invite.id);
        console.log("Unauthorized accept allowed? FAILED");
    } catch (e: any) {
        console.log("Unauthorized accept blocked successfully. Error:", e.message);
    }

    // B accepts A
    const accepted = await acceptConnectionInvite(tB.id, invite.id);
    console.log("B accepted A's invite. Relationship created:", accepted.relationship.id);

    // 5. Connection Details View
    console.log("\n--- Connection Details ---");
    const relDetails = await getConnectionDetails(tA.id, accepted.relationship.id);
    console.log("Details for A viewing relationship with B:");
    console.log("- Source Profile Legal Name:", relDetails.sourceProfile.legalName);
    console.log("- Target Profile Legal Name:", relDetails.targetProfile.legalName);

    // 6. Cleanup
    await prisma.tenant.deleteMany({
        where: { id: { in: [tA.id, tB.id, tC.id] } }
    });
    console.log("\n--- Cleanup Done ---");
}

runSmokeTest().catch(console.error);
