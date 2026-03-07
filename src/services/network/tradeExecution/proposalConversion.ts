import { NetworkTradeProposalStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

export class ProposalConversion {

    /**
     * Called when a proposal has status ACCEPTED or when Auto-Route policy executes.
     * Starts the Order and Escrow execution.
     */
    static async convertProposalToOrder(proposalId: string) {
        const proposal = await prisma.networkTradeProposal.findUnique({
            where: { id: proposalId }
        });

        if (!proposal || proposal.status !== NetworkTradeProposalStatus.ACCEPTED) {
            throw new Error("Cannot convert proposal to order unless ACCEPTED");
        }

        // Mock conversion logic integrating the legacy endpoints/schemas conceptually.
        // In full stack, this invokes Order Engine -> Escrow Flow -> Shipping Infrastructure

        console.log(`[PROPOSAL_CONVERSION] Emitting Order Generation for Proposal ${proposalId}`);
        console.log(`[PROPOSAL_CONVERSION] Emitting Escrow requirement check: ${proposal.escrowRequired}`);

        // Mark Converted
        await prisma.networkTradeProposal.update({
            where: { id: proposalId },
            data: { status: NetworkTradeProposalStatus.CONVERTED_TO_ORDER }
        });

        return { orderId: `SYS_ORD_${Math.random().toString(36).substring(7).toUpperCase()}`, status: 'DRAFT_ESTABLISHED' };
    }
}
