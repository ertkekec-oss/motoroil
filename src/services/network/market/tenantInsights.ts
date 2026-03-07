import prisma from '@/lib/prisma';
import { upsertDerivedSignalSafely } from '../hardening/signals/signalLifecycle';
import { getCurrentCalculationVersion } from '../hardening/rebuild/versioning';
import { TenantMarketInsightType, TenantRecommendedAction } from '@prisma/client';
import { NetworkHardeningError, NetworkProcessingErrorType } from '../hardening/observability/errorTypes';
import { getAutomationPolicy } from '../hardening/policies/automationPolicy';

export async function generateTenantMarketInsights(tenantId: string) {
    const version = await getCurrentCalculationVersion('TenantMarketInsight');
    const profile = await prisma.networkCompanyProfile.findUnique({ where: { tenantId } });
    if (!profile) throw new NetworkHardeningError(NetworkProcessingErrorType.VALIDATION_ERROR, 'Profile not found');

    const policy = await getAutomationPolicy(tenantId);

    // Collect relevant global signals
    const signals = await prisma.networkMarketSignal.findMany({
        where: { status: 'ACTIVE' },
        take: 10
    });

    const results = [];

    for (const signal of signals) {
        if (signal.signalType === 'DEMAND_SPIKE' || signal.signalType === 'SUPPLY_SHORTAGE') {

            // Check if tenant has B2B capability for this category (mock logic)
            // If they are a supplier but no B2B listing: Action OPEN_B2B_LISTING

            let recommendedAction: TenantRecommendedAction = 'WAIT_AND_MONITOR';
            if (signal.signalType === 'DEMAND_SPIKE' && profile.isPublicListingEnabled) {
                recommendedAction = 'BOOST_VISIBILITY';
            } else if (signal.signalType === 'DEMAND_SPIKE') {
                recommendedAction = policy.autoRecommendationEnabled ? 'OPEN_B2B_LISTING' : 'WAIT_AND_MONITOR';
            }

            const insight = await upsertDerivedSignalSafely(
                prisma.tenantMarketInsight,
                { tenantId, profileId: profile.id, categoryId: signal.categoryId, insightType: 'SELL_OPPORTUNITY' as TenantMarketInsightType },
                {
                    score: signal.intensityScore,
                    confidence: signal.confidenceScore,
                    priority: signal.intensityScore > 80 ? 1 : 2,
                    summary: `Talep artışı ve BUY fırsatı yoğunluğuna dayalı sıcak bölge önerisi.`,
                    relatedMarketSignalId: signal.id,
                    recommendedAction
                },
                version,
                new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // expires in 7 days
            );
            results.push(insight);
        }
    }

    return results;
}
