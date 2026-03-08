import { recalculateCompanyTrustProfile } from "@/domains/company-identity/services/companyTrust.service";

/**
 * Worker Job: recalculate-trust-profile
 * Queue: company-identity
 * Purpose: Recalculates the trust score for a specific tenant based on signals and identity.
 */
export async function processRecalculateTrustProfileJob(data: { tenantId: string }) {
    try {
        console.log(`Starting trust profile recalculation for tenant: ${data.tenantId}`);
        const result = await recalculateCompanyTrustProfile(data.tenantId);
        console.log(`Successfully recalculated trust for ${data.tenantId}. Level: ${result.trustLevel}, Score: ${result.overallScore}`);
        return result;
    } catch (error) {
        console.error(`Failed to recalculate trust for ${data.tenantId}`, error);
        throw error;
    }
}
