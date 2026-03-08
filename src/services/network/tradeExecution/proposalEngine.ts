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



    static async generateProposalForMatch(matchId: string, forceActionIntent?: string) {
        const match = await prisma.networkLiquidityMatch.findUnique({
            where: { id: matchId },
            include: { opportunity: true }
        });

        if (!match) throw new Error("Liquidity Match not found");

        const dedupeKey = this.generateDedupeKey(match.buyerTenantId, match.sellerTenantId, match.categoryId || 'GENERIC');

        // 🟢 Idempotency & RACE CONDITION PROTECTION
        const existingProposal = await prisma.networkTradeProposal.findFirst({
            where: { dedupeKey }
        });

        if (existingProposal) {
            console.log(`[ProposalEngine] Proposal already exists for key ${dedupeKey}. Avoiding duplicate upsert.`);
            return existingProposal;
        }

        const executionIntent = ProposalPolicy.getTenantPolicy(match.buyerTenantId);
        const actionIntent = forceActionIntent || (executionIntent === 'AUTO_ROUTE' || executionIntent === 'AUTO_RFQ' ? 'PROPOSE' : 'SUGGEST');

        if (!ProposalPolicy.assertTradeExecutionAllowed(match.buyerTenantId, actionIntent)) {
            throw new Error(`Policy block: action ${actionIntent} not allowed for ${match.buyerTenantId}`);
        }

        const priceBand = ProposalDrafting.estimatePriceBand(match.categoryId || '', match.productRef || undefined);
        const quantityBand = ProposalDrafting.estimateQuantityBand(match.categoryId || '', match.buyerTenantId, match.sellerTenantId);

        const proposalScore = ProposalRanking.calculateProposalScore(
            match.finalMatchScore,
            match.trustScore,
            match.reputationScore,
            match.shippingReliabilityScore,
            100 - match.financialRiskScore, // Finance Safety
            match.opportunity.liquidityVolumeScore // Demand Urgency approximation
        );

        const initialStatus = actionIntent === 'PROPOSE' ? NetworkTradeProposalStatus.PROPOSED : NetworkTradeProposalStatus.SUGGESTION;
        const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hrs

        const proposal = await prisma.networkTradeProposal.upsert({
            where: { dedupeKey },
            update: {
                status: initialStatus,
                updatedAt: new Date()
            },
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

        await prisma.networkLiquidityMatch.update({
            where: { id: match.id },
            data: { status: 'PROPOSED' }
        });

        // 🟢 Hook into Unified Trade Ledger
        const { TradeLedgerIngestionService } = await import('@/domains/trade-ledger/services/tradeLedgerIngestion.service');
        await TradeLedgerIngestionService.recordFromProposal(proposal.id).catch(err => {
            console.error('[TradeLedger] Failed to append proposal:', err);
        });

        return proposal;
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
                const proposal = await this.generateProposalForMatch(match.id);
                proposals.push(proposal);
            } catch (err: any) {
                console.warn(`[ProposalEngine] match ${match.id} skipped: ${err.message}`);
                continue;
            }
        }

        return proposals.length;
    }
}
