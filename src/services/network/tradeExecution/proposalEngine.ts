import { PrismaClient, NetworkTradeProposalStatus, NetworkTradePolicyMode } from '@prisma/client';
import { ProposalDrafting } from './proposalDrafting';
import { ProposalRanking } from './proposalRanking';
import { ProposalExplain } from './proposalExplain';
import { ProposalPolicy } from './proposalPolicy';

const prisma = new PrismaClient();

export class ProposalEngine {

    static generateDedupeKey(buyerTenantId: string, sellerTenantId: string, categoryId: string) {
        return `PROP_${buyerTenantId}_${sellerTenantId}_${categoryId}_${new Date().toISOString().split('T')[0]}`;
    }

    static async generateTradeProposalsFromLiquidity() {
        const matches = await prisma.networkLiquidityMatch.findMany({
            where: { status: 'CANDIDATE' },
            include: { opportunity: true },
            take: 100
        });

        const proposals = [];

        for (const match of matches) {
            try {
                // Determine execution intent based on policy
                const executionIntent = ProposalPolicy.getTenantPolicy(match.buyerTenantId);

                // Check policy block
                const actionIntent = executionIntent === 'AUTO_ROUTE' || executionIntent === 'AUTO_RFQ' ? 'PROPOSE' : 'SUGGEST';
                if (!ProposalPolicy.assertTradeExecutionAllowed(match.buyerTenantId, actionIntent)) {
                    continue;
                }

                const priceBand = ProposalDrafting.estimatePriceBand(match.categoryId || '', match.productRef || undefined);
                const quantityBand = ProposalDrafting.estimateQuantityBand(match.categoryId || '', match.buyerTenantId, match.sellerTenantId);

                // Calculate proposal score
                const proposalScore = ProposalRanking.calculateProposalScore(
                    match.finalMatchScore,
                    match.trustScore,
                    match.reputationScore,
                    match.shippingReliabilityScore,
                    100 - match.financialRiskScore, // Finance Safety
                    match.opportunity.liquidityVolumeScore // Demand Urgency approximation
                );

                const explainJson = ProposalExplain.generateExplanation({
                    demandUrgency: match.opportunity.liquidityVolumeScore,
                    graphDistance: match.graphDistance,
                    shippingReliability: match.shippingReliabilityScore,
                    financialSafety: 100 - match.financialRiskScore,
                    proposalScore
                });

                const dedupeKey = this.generateDedupeKey(match.buyerTenantId, match.sellerTenantId, match.categoryId || 'GENERIC');

                const initialStatus = actionIntent === 'PROPOSE' ? NetworkTradeProposalStatus.PROPOSED : NetworkTradeProposalStatus.SUGGESTION;

                const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hrs

                const proposal = await prisma.networkTradeProposal.upsert({
                    where: { dedupeKey },
                    update: {},
                    create: {
                        opportunityId: match.opportunityId,
                        liquidityMatchId: match.id,
                        buyerTenantId: match.buyerTenantId,
                        sellerTenantId: match.sellerTenantId,
                        categoryId: match.categoryId,
                        productRef: match.productRef,
                        proposedQuantityLow: quantityBand.low,
                        proposedQuantityHigh: quantityBand.high,
                        proposedPriceLow: priceBand.low,
                        proposedPriceHigh: priceBand.high,
                        currency: 'TRY',
                        shippingMode: 'DYNAMIC_NETWORK',
                        paymentMode: 'B2B_ESCROW',
                        escrowRequired: match.financialRiskScore > 20,
                        status: initialStatus,
                        policyMode: executionIntent,
                        confidenceScore: proposalScore,
                        riskScore: match.financialRiskScore,
                        dedupeKey,
                        expiresAt,
                        calculationVersion: '1.0.0',
                    }
                });

                proposals.push(proposal);

                await prisma.networkLiquidityMatch.update({
                    where: { id: match.id },
                    data: { status: 'PROPOSED' }
                });

            } catch (err: any) {
                // Skip if blocked by policy or logic error
                console.warn(`[ProposalEngine] match ${match.id} skipped: ${err.message}`);
                continue;
            }
        }

        return proposals.length;
    }
}
