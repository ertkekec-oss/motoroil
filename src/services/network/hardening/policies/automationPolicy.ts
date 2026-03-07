import prisma from '@/lib/prisma';

export async function resolveSafeDefaultPolicy(tenantId: string) {
    let policy = await prisma.networkAutomationPolicy.findUnique({
        where: { tenantId }
    });

    if (!policy) {
        policy = await prisma.networkAutomationPolicy.create({
            data: {
                tenantId,
                autoRecommendationEnabled: false,
                autoOpportunityGenerationEnabled: false,
                autoRFQDraftEnabled: false,
                autoRoutingEnabled: false,
                requireManualApprovalForRouting: true,
                minTrustScoreForAutomation: 50,
                minConfidenceForAutomation: 60,
                allowFallbackRouting: false,
                restrictedSupplierHandling: 'EXCLUDE'
            }
        });
    }

    return policy;
}

export async function getAutomationPolicy(tenantId: string) {
    return resolveSafeDefaultPolicy(tenantId);
}
