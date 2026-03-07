import { NetworkMarketSignal, TenantMarketInsight } from '@prisma/client';

export function projectMarketSignalForTenant(signal: NetworkMarketSignal & { explanationJson?: any }) {
    if (!signal) return null;

    // Only return aggregate info, safe for cross-tenant
    return {
        id: signal.id,
        signalScopeType: signal.signalScopeType,
        categoryId: signal.categoryId,
        regionCode: signal.regionCode,
        signalType: signal.signalType,
        intensity: Math.round(signal.intensityScore),
        confidence: Math.round(signal.confidenceScore),
        trendDirection: signal.trendDirection,
        summary: signal.signalSummary,
        userFriendlyExplanation: signal.explanationJson?.userFriendlyExplanation || null,
        topDrivers: signal.explanationJson?.topDrivers || [],
        createdAt: signal.createdAt
    };
}

export function projectMarketSignalForAdmin(signal: NetworkMarketSignal & { explanationJson?: any }) {
    if (!signal) return null;

    return {
        ...signal,
        explanationDetails: signal.explanationJson,
        isStaleFlag: signal.isStale,
        version: signal.calculationVersion
    };
}

export function projectTenantInsightForTenant(insight: TenantMarketInsight & { explanationJson?: any }) {
    if (!insight) return null;

    return {
        id: insight.id,
        insightType: insight.insightType,
        categoryId: insight.categoryId,
        score: Math.round(insight.score),
        confidence: Math.round(insight.confidence),
        priority: insight.priority,
        summary: insight.summary,
        recommendedAction: insight.recommendedAction,
        userFriendlyExplanation: insight.explanationJson?.userFriendlyExplanation || null,
        createdAt: insight.createdAt
    };
}

export function projectTenantInsightForAdmin(insight: TenantMarketInsight & { explanationJson?: any }) {
    if (!insight) return null;

    return {
        ...insight,
        explanationDetails: insight.explanationJson,
        isStaleFlag: insight.isStale,
        version: insight.calculationVersion
    };
}
