import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DisputeProbabilityService {
    /**
     * Estimates the probability of a dispute arising in a transaction contextual scope.
     */
    static async estimateDisputeProbability(context: { buyerTenantId?: string, sellerTenantId?: string, isNewRelationship?: boolean }) {
        // In a real implementation this leverages historical clustering and previous reputation.
        // Here we implement heuristic scoring.
        let riskScore = 15; // Base risk%

        if (context.isNewRelationship) riskScore += 20;

        // Checking component scores for involved parties
        if (context.buyerTenantId) {
            const buyerRep = await prisma.networkReputationScore.findFirst({
                where: { tenantId: context.buyerTenantId, status: 'ACTIVE' }
            });
            if (buyerRep && buyerRep.disputeComponentScore < 60) riskScore += 15;
        }

        if (context.sellerTenantId) {
            const sellerRep = await prisma.networkReputationScore.findFirst({
                where: { tenantId: context.sellerTenantId, status: 'ACTIVE' }
            });
            if (sellerRep && sellerRep.shippingComponentScore < 75) riskScore += 25; // shipping relates heavily to dispute
        }

        return Math.min(100, riskScore); // returns 0-100 probability
    }

    static async buildDisputeProbabilityBreakdown(context: any) {
        const prob = await this.estimateDisputeProbability(context);
        return {
            score: prob,
            factors: ["Analyzed counterparty components", "Evaluated shipping history"],
            riskClass: prob > 50 ? 'HIGH' : 'LOW'
        };
    }
}
