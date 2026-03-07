import { PrismaClient, NetworkTradeProposalStatus, NetworkTradeProposalDecisionType } from '@prisma/client';

const prisma = new PrismaClient();

export class CounterpartyWorkflow {

    static async submitCounterOffer(proposalId: string, tenantId: string, options: { price: number, quantity: number, message: string }) {
        const proposal = await prisma.networkTradeProposal.findUnique({ where: { id: proposalId } });
        if (!proposal) throw new Error("Proposal not found");

        if (proposal.status !== NetworkTradeProposalStatus.PROPOSED &&
            proposal.status !== NetworkTradeProposalStatus.NEGOTIATION &&
            proposal.status !== NetworkTradeProposalStatus.SUGGESTION) {
            throw new Error("Proposal is not in a negotiable state");
        }

        const msg = await prisma.networkTradeProposalMessage.create({
            data: {
                proposalId,
                senderTenantId: tenantId,
                messageType: 'COUNTER_OFFER',
                payloadJson: {
                    price: options.price,
                    quantity: options.quantity,
                    message: options.message
                }
            }
        });

        await prisma.networkTradeProposal.update({
            where: { id: proposalId },
            data: { status: NetworkTradeProposalStatus.NEGOTIATION }
        });

        return msg;
    }

    static async acceptProposal(proposalId: string, tenantId: string) {
        const proposal = await prisma.networkTradeProposal.findUnique({ where: { id: proposalId } });
        if (!proposal) throw new Error("Proposal not found");

        await prisma.$transaction(async (tx) => {
            await tx.networkTradeProposalDecision.create({
                data: {
                    proposalId,
                    decisionType: NetworkTradeProposalDecisionType.ACCEPT,
                    decidedByTenantId: tenantId,
                    decisionReason: 'Accepted manually via negotiated terms'
                }
            });

            await tx.networkTradeProposal.update({
                where: { id: proposalId },
                data: { status: NetworkTradeProposalStatus.ACCEPTED }
            });
        });

        return { success: true, status: NetworkTradeProposalStatus.ACCEPTED };
    }

    static async rejectProposal(proposalId: string, tenantId: string, reason: string) {
        const proposal = await prisma.networkTradeProposal.findUnique({ where: { id: proposalId } });
        if (!proposal) throw new Error("Proposal not found");

        await prisma.$transaction(async (tx) => {
            await tx.networkTradeProposalDecision.create({
                data: {
                    proposalId,
                    decisionType: NetworkTradeProposalDecisionType.REJECT,
                    decidedByTenantId: tenantId,
                    decisionReason: reason
                }
            });

            await tx.networkTradeProposal.update({
                where: { id: proposalId },
                data: { status: NetworkTradeProposalStatus.REJECTED }
            });
        });

        return { success: true, status: NetworkTradeProposalStatus.REJECTED };
    }
}
