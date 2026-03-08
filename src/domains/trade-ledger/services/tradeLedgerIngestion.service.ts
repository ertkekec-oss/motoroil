import prisma from '@/lib/prisma';
import { TradeLedgerService } from './tradeLedger.service';
import { TradeLedgerEventTypes } from '../utils/tradeLedgerEventMap';
import { NetworkGrowthService } from '../../network-growth/services/networkGrowth.service';

export class TradeLedgerIngestionService {
    static async recordFromLiquidityMatch(matchId: string) {
        const match = await prisma.networkLiquidityMatch.findUnique({
            where: { id: matchId },
            include: { opportunity: true }
        });
        if (!match) return;

        await TradeLedgerService.recordEvent({
            buyerTenantId: match.buyerTenantId,
            sellerTenantId: match.sellerTenantId,
            canonicalProductId: match.categoryId || undefined,
            productId: match.productRef || undefined,
            opportunityId: match.opportunityId,
            eventType: TradeLedgerEventTypes.LIQUIDITY_MATCH_CREATED,
            eventStatus: match.status,
            sourceType: 'NetworkLiquidityMatch',
            sourceRef: match.id,
            metadataJson: { finalMatchScore: match.finalMatchScore }
        });
    }

    static async recordFromProposal(proposalId: string) {
        const proposal = await prisma.networkTradeProposal.findUnique({ where: { id: proposalId } });
        if (!proposal) return;

        await TradeLedgerService.recordEvent({
            buyerTenantId: proposal.buyerTenantId,
            sellerTenantId: proposal.sellerTenantId,
            canonicalProductId: proposal.categoryId || undefined,
            productId: proposal.productRef || undefined,
            opportunityId: proposal.opportunityId,
            proposalId: proposal.id,
            eventType: TradeLedgerEventTypes.PROPOSAL_CREATED,
            eventStatus: proposal.status,
            amount: proposal.proposedPriceHigh,
            quantity: proposal.proposedQuantityHigh,
            currency: proposal.currency,
            sourceType: 'NetworkTradeProposal',
            sourceRef: proposal.id
        });
    }

    static async recordTradeCompleted(params: {
        buyerTenantId: string;
        sellerTenantId: string;
        proposalId?: string;
        contractId?: string;
        amount?: number;
        canonicalProductId?: string;
    }) {
        await TradeLedgerService.recordEvent({
            ...params,
            eventType: TradeLedgerEventTypes.TRADE_COMPLETED,
            sourceType: 'Manual/Integration'
        });

        // Fire growth evaluation asynchronously
        // In production, enqueue to BullMQ
        NetworkGrowthService.evaluateGrowthTriggersFromCompletedTrade(params).catch(console.error);
    }
}
