import { PrismaClient, NetworkLiquidityOpportunityType, NetworkLiquidityOpportunityStatus, NetworkLiquidityMatchStatus } from '@prisma/client';
import { ProposalEngine } from '../src/services/network/tradeExecution/proposalEngine';

const prisma = new PrismaClient();

async function runTest() {
    console.log("=== Testing Liquidity & Proposal Unification ===");

    // 1. Target Tenant setup
    const buyerTenantId = `TEST_LIQ_BUYER_${Date.now()}`;
    const sellerTenantId = `TEST_LIQ_SELLER_${Date.now()}`;

    // We mock existing identities instead of creating deep structs, if logic allows...
    // Actually ProposalEngine doesn't strictly check the DB for Tenant rows, just `buyerTenantId` in rules unless strict FKs apply.
    // wait, CompanyIdentity is missing, let's just insert one if it's strictly needed by UI, but here we just test backend logic.
    // liquidityMatch requires buyerTenantId/sellerTenantId.

    // Let's create an Opportunity & Match to act as the source of truth
    const opportunityId = `OPP_${Date.now()}`;
    const dedupeKey = `LIQ_TEST_${Date.now()}`;

    console.log("Creating Test Liquidity Opportunity...");
    const opp = await prisma.networkLiquidityOpportunity.create({
        data: {
            id: opportunityId,
            opportunityType: NetworkLiquidityOpportunityType.SUPPLY_SURPLUS,
            categoryId: 'CAT_TEST_AUTO',
            supplyTenantId: sellerTenantId,
            demandTenantId: buyerTenantId,
            liquidityVolumeScore: 80,
            status: NetworkLiquidityOpportunityStatus.DISCOVERED,
            dedupeKey,
            calculationVersion: '1.0.0',
        }
    });

    console.log("Creating Test Liquidity Match...");
    const match = await prisma.networkLiquidityMatch.create({
        data: {
            opportunityId: opp.id,
            buyerTenantId: buyerTenantId,
            sellerTenantId: sellerTenantId,
            categoryId: 'CAT_TEST_AUTO',
            trustScore: 90,
            reputationScore: 85,
            financialRiskScore: 10,
            shippingReliabilityScore: 95,
            finalMatchScore: 88,
            status: NetworkLiquidityMatchStatus.CANDIDATE,
        }
    });

    console.log("Liquidity Match ID:", match.id);

    // 2. Trigger the "Auto RFQ" (ProposalEngine generation)
    console.log("Triggering Proposal Engine for Match...");
    try {
        const proposal = await ProposalEngine.generateProposalForMatch(match.id, 'PROPOSE');

        console.log("Proposal successfully created from Liquidty Match source of truth!");
        console.log("Proposal ID:", proposal.id);
        console.log("Proposal Amount Low:", proposal.proposedPriceLow);

        // Ensure status updated
        const updatedMatch = await prisma.networkLiquidityMatch.findUnique({ where: { id: match.id } });
        console.log("Original Match Status is now:", updatedMatch?.status);

    } catch (e: any) {
        console.error("Test failed:", e.message);
    }

    // Cleanup
    await prisma.networkLiquidityMatch.delete({ where: { id: match.id } });
    await prisma.networkLiquidityOpportunity.delete({ where: { id: opp.id } });

    // Cleanup generated proposals based on the matching dedupeKey prefix
    const pDedupeKey = `PROP_${buyerTenantId}_${sellerTenantId}`;
    await prisma.networkTradeProposal.deleteMany({
        where: { dedupeKey: { startsWith: pDedupeKey } }
    });

    console.log("Cleanup complete.");
    process.exit(0);
}

runTest().catch(console.error);
