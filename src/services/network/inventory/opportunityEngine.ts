import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { calculateNetworkProximity } from '../discovery/proximity';

export async function generateTradeOpportunities() {
    console.log("[Opportunity Engine] Generating Trade Opportunities...");

    // Find all OVERSTOCK signals
    const overstocks = await prisma.networkInventorySignal.findMany({
        where: { signalType: 'OVERSTOCK' },
        include: { profile: { include: { trustScore: true } } }
    });

    // Find all STOCKOUT_RISK and HIGH_DEMAND signals
    const demands = await prisma.networkInventorySignal.findMany({
        where: { signalType: { in: ['STOCKOUT_RISK', 'HIGH_DEMAND'] } },
        include: { profile: { include: { trustScore: true } } }
    });

    let generatedCount = 0;

    for (const demand of demands) {
        // Find matching overstock suppliers in the same category
        const matchingSuppliers = overstocks.filter(o =>
            o.productCategoryId === demand.productCategoryId &&
            o.profileId !== demand.profileId // prevent self-match
        );

        for (const overstock of matchingSuppliers) {
            // Calculate opportunity score
            const proximity = await calculateNetworkProximity(demand.tenantId, overstock.tenantId);
            const supplierTrust = overstock.profile.trustScore?.score || 0;
            const signalConfidence = (demand.confidenceScore + overstock.confidenceScore) / 2;

            // Simplified score components
            const score = (supplierTrust * 0.4) + (proximity * 0.3) + (signalConfidence * 0.3);

            // Minimum score to consider an opportunity
            if (score > 40) {
                const existingOp = await prisma.networkTradeOpportunity.findFirst({
                    where: {
                        supplierProfileId: overstock.profileId,
                        buyerProfileId: demand.profileId,
                        categoryId: demand.productCategoryId,
                        signalType: 'OVERSTOCK'
                    }
                });

                if (!existingOp) {
                    const opp = await prisma.networkTradeOpportunity.create({
                        data: {
                            supplierProfileId: overstock.profileId,
                            buyerProfileId: demand.profileId,
                            categoryId: demand.productCategoryId,
                            signalType: 'OVERSTOCK', // Supplier's perspective
                            opportunityScore: score,
                            confidence: signalConfidence
                        }
                    });

                    await publishEvent({
                        type: 'NETWORK_TRADE_OPPORTUNITY_CREATED',
                        tenantId: demand.tenantId, // Buyer is the primary target
                        meta: { opportunityId: opp.id }
                    });

                    generatedCount++;
                }
            }
        }
    }

    console.log(`[Opportunity Engine] Finished. Generated ${generatedCount} new opportunities.`);
    return generatedCount;
}
