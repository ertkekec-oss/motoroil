import { NetworkDispute, NetworkDisputeEvidence, NetworkDisputeEvidenceVisibility } from '@prisma/client';

export class DisputeProjection {
    /**
     * Projects a dispute list or object for the tenant, filtering out evidence based on scope.
     */
    static projectForTenant(tenantId: string, dispute: any) {
        if (!dispute) return null;

        // Ensure tenant is a participant
        if (dispute.openedByTenantId !== tenantId && dispute.againstTenantId !== tenantId) {
            return null;
        }

        const projectedDispute = { ...dispute };

        // Filter evidence based on visibility
        if (projectedDispute.evidences) {
            projectedDispute.evidences = projectedDispute.evidences.filter((ev: NetworkDisputeEvidence) => {
                if (ev.visibilityScope === NetworkDisputeEvidenceVisibility.ADMIN_ONLY) {
                    return false;
                }
                if (ev.visibilityScope === NetworkDisputeEvidenceVisibility.UPLOADER_AND_ADMIN) {
                    return ev.uploadedByTenantId === tenantId;
                }
                return true; // BOTH_PARTIES
            });
        }

        // Mask internal fields that might have leaked into admin resolution notes
        // Normally resolutionNotes are visible, but maybe some fields shouldn't be.
        // For now, no masking needed besides evidence filtering.

        return projectedDispute;
    }
}

