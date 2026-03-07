import { ProposalEngine } from '../src/services/network/tradeExecution/proposalEngine';

async function main() {
    console.log('🔄 Starting Trade Proposal Generation Test...');

    try {
        const count = await ProposalEngine.generateTradeProposalsFromLiquidity();
        console.log(`✅ Proposal generation completed. Generated count: ${count}`);
    } catch (e: any) {
        console.error('❌ Proposal generation failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
