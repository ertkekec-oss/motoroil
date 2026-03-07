import { PrismaClient } from '@prisma/client';
import { CounterpartyWorkflow } from '../src/services/network/tradeExecution/counterpartyWorkflow';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Trade Negotiation Workflow Test...');

    try {
        const proposal = await prisma.networkTradeProposal.findFirst({
            where: { status: 'SUGGESTION' }
        });

        if (!proposal) {
            console.log('⚠️ No proposals available to negotiate. Run proposal generation first.');
            return;
        }

        console.log(`💬 Submitting counter-offer for proposal ${proposal.id}...`);

        await CounterpartyWorkflow.submitCounterOffer(proposal.id, proposal.buyerTenantId, {
            price: proposal.proposedPriceLow * 0.95,
            quantity: proposal.proposedQuantityHigh,
            message: "I can take the max volume if you lower the price by 5%."
        });

        console.log(`✅ Counter-offer submitted. Proceeding to accept...`);

        const acceptResult = await CounterpartyWorkflow.acceptProposal(proposal.id, proposal.sellerTenantId);

        console.log(`✅ Proposal Accept result:`, acceptResult);

    } catch (e: any) {
        console.error('❌ Negotiation test failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
