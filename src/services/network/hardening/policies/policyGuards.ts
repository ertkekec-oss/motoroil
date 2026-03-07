import { getAutomationPolicy } from './automationPolicy';

export async function assertPolicyAllows(action: string, context: { tenantId: string, trustScore?: number, confidence?: number }) {
    const policy = await getAutomationPolicy(context.tenantId);

    switch (action) {
        case 'AUTO_RECOMMENDATION':
            if (!policy.autoRecommendationEnabled) throw new Error("Policy Blocked: Auto Recommendation disabled");
            break;
        case 'AUTO_OPPORTUNITY':
            if (!policy.autoOpportunityGenerationEnabled) throw new Error("Policy Blocked: Auto Opportunity generation disabled");
            break;
        case 'AUTO_ROUTING':
            if (!policy.autoRoutingEnabled) throw new Error("Policy Blocked: Auto Routing disabled");
            if (context.trustScore !== undefined && context.trustScore < policy.minTrustScoreForAutomation) {
                throw new Error("Policy Blocked: Trust score too low");
            }
            if (context.confidence !== undefined && context.confidence < policy.minConfidenceForAutomation) {
                throw new Error("Policy Blocked: Confidence too low");
            }
            break;
    }

    return true;
}

export function buildAutomationDecision(policy: any, input: any) {
    if (policy.restrictedSupplierHandling === 'EXCLUDE' && input.isRestricted) {
        return { allowed: false, reason: 'RESTRICTED_MEMBER' };
    }
    return { allowed: true };
}
