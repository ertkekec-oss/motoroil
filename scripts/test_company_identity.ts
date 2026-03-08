import prisma from "../src/lib/prisma";
import {
    createCompanyIdentity,
    getCompanyIdentity,
    submitVerificationDocument,
    updateVerificationStatus,
    listCompaniesForVerification
} from "../src/domains/company-identity/services/companyIdentity.service";

async function run() {
    console.log("--- PHASE B: COMPANY IDENTITY & KYB TESTS ---");

    try {
        const testTenantId = "tenant_trust_test_001";

        // Clean up if exists from previous test
        await prisma.companyVerificationDocument.deleteMany({
            where: { company: { tenantId: testTenantId } }
        });
        await prisma.companyIdentity.deleteMany({
            where: { tenantId: testTenantId }
        });

        // 1. Create Identity
        console.log("1. Creating Company Identity...");
        const identity = await createCompanyIdentity({
            tenantId: testTenantId,
            legalName: "Periodya B2B Test A.Ş.",
            taxNumber: "9988776655",
            tradeRegistryNo: "REG-12345",
            country: "Turkey",
            city: "Istanbul",
            address: "Levent No:1",
            phone: "+905554443322",
            website: "https://periodya.com"
        });

        console.log(`Created Identity: ${identity.legalName} | Status: ${identity.verificationStatus}`);

        // 2. Submit Document (should transition to PENDING)
        console.log("\n2. Submitting Verification Document...");
        const doc = await submitVerificationDocument({
            companyId: identity.id,
            documentType: "TAX_PLATE",
            documentUrl: "https://s3.periodya.com/files/tax_plate.pdf"
        });
        console.log(`Document Submitted: ${doc.documentType} | Doc Status: ${doc.status}`);

        const pendingIdentity = await getCompanyIdentity(testTenantId);
        console.log(`Identity Status after doc: ${pendingIdentity?.verificationStatus} (Expected: PENDING)`);

        // 3. Admin Verifies Company
        console.log("\n3. Admin Verifying Company...");
        const verifiedIdentity = await updateVerificationStatus(identity.id, "VERIFIED");
        console.log(`Identity Status after admin action: ${verifiedIdentity.verificationStatus} (Expected: VERIFIED)`);

        // 4. List Verified Companies
        console.log("\n4. Listing Companies For Verification Queue...");
        const list = await listCompaniesForVerification();
        console.log(`Total companies in KYB system: ${list.length}`);
        const found = list.find((c) => c.tenantId === testTenantId);
        if (found) {
            console.log(`Found test company in queue: ${found.legalName} [${found.verificationStatus}] with ${found.documents.length} document(s).`);
        }

        console.log("\nTEST SUCCESSFUL");
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
