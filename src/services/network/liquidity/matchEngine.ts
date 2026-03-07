import { PrismaClient, NetworkLiquidityMatchStatus } from '@prisma/client';
import { SupplyCandidate } from './supplyDetector';
import { DemandCandidate } from './demandDetector';
import { LiquidityRanking } from './liquidityRanking';
import { LiquidityExplain } from './liquidityExplain';

const prisma = new PrismaClient();

export class MatchEngine {
    static async generateLiquidityMatches(
        opportunityId: string,
        supplyCandidates: SupplyCandidate[],
        demandCandidates: DemandCandidate[]
    ) {
        const matches = [];

        for (const sup of supplyCandidates) {
            for (const dem of demandCandidates) {
                if (sup.tenantId === dem.tenantId) continue;
                if (sup.categoryId !== dem.categoryId) continue;

                // Graph proximity (mock - would normally come from Network Graph Query Engine)
                const graphDistance = (sup.clusterId === dem.clusterId) ? 1 : Math.round(Math.random() * 3) + 2;

                // Fetch scores (mock logic for prototype)
                // These would normally be queried from NetworkTrustScore, ReputationScore etc.
                const trustScore = 85;
                const reputationScore = 90;
                const shippingScore = 88;
                const financeRisk = 10;

                // Take the smaller volume representing the liquidity pipeline bottleneck
                const liquidityVolume = Math.min(sup.volumeScore, dem.volumeScore);

                const finalMatchScore = LiquidityRanking.calculateMatchScore(
                    graphDistance, trustScore, reputationScore, shippingScore, financeRisk, liquidityVolume
                );

                const explainJson = LiquidityExplain.generateExplanation({
                    trustScore, reputationScore, graphDistance, shippingScore, financeRisk, matchScore: finalMatchScore
                });

                matches.push({
                    opportunityId,
                    buyerTenantId: dem.tenantId,
                    sellerTenantId: sup.tenantId,
                    categoryId: sup.categoryId,
                    productRef: sup.productRef,
                    graphDistance,
                    trustScore,
                    reputationScore,
                    shippingReliabilityScore: shippingScore,
                    financialRiskScore: financeRisk,
                    finalMatchScore,
                    status: NetworkLiquidityMatchStatus.CANDIDATE,
                    explainJson
                });
            }
        }

        if (matches.length > 0) {
            // Since we don't have composite keys enforced on the DB schema for matches
            // we create directly. In production, we'd upsert.
            await prisma.networkLiquidityMatch.createMany({
                data: matches as any,
                skipDuplicates: true
            });
        }

        return matches;
    }
}
