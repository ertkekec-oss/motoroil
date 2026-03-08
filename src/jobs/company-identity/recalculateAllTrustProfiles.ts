import prisma from "@/lib/prisma";
import { processRecalculateTrustProfileJob } from "./recalculateTrustProfile";

/**
 * Worker Job: recalculate-all-trust-profiles
 * Queue: company-identity
 * Purpose: Iterates over all active trust profiles and recalculates their trust scores in batch.
 */
export async function processRecalculateAllTrustProfilesJob() {
    try {
        console.log("Starting batch recalculation of all trust profiles...");

        // Find all identities OR existing trust profiles 
        const identities = await prisma.companyIdentity.findMany({ select: { tenantId: true } });

        console.log(`Found ${identities.length} tenant profiles to recalculate.`);

        let successCount = 0;
        let failCount = 0;

        for (const identity of identities) {
            try {
                await processRecalculateTrustProfileJob({ tenantId: identity.tenantId });
                successCount++;
            } catch (err) {
                console.error(`Error recalculating tenant ${identity.tenantId}:`, err);
                failCount++;
            }
        }

        console.log(`Batch Trust Recalculation Complete. Success: ${successCount}, Fail: ${failCount}`);
    } catch (error) {
        console.error("Failed batch recalculation job", error);
        throw error;
    }
}
