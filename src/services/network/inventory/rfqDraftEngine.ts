import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { ProposalEngine } from '@/services/network/tradeExecution/proposalEngine';

export async function generateAutoRFQ(matchId: string, tenantId: string) {
    console.log(`[RFQ Draft Engine] Generating Auto Draft (Trade Proposal) for Match ${matchId}...`);

    // Verify ownership
    const match = await prisma.networkLiquidityMatch.findUnique({
        where: { id: matchId },
        include: { opportunity: true }
    });

    if (!match) throw new Error("Match not found");

    if (match.buyerTenantId !== tenantId && match.sellerTenantId !== tenantId) {
        throw new Error("Unauthorized to access this match");
    }

    // Call the real unified Proposal Engine without forcing intent so policy can decide
    const proposal = await ProposalEngine.generateProposalForMatch(matchId);

    await publishEvent({
        type: 'NETWORK_RFQ_DRAFT_GENERATED',
        tenantId,
        meta: {
            opportunityId: match.opportunityId,
            matchId: match.id,
            proposalId: proposal.id,
            buyerId: match.buyerTenantId,
            supplierId: match.sellerTenantId
        }
    });

    return { success: true, draft: proposal };
}
