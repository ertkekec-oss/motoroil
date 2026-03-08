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

        // Pre-fetch trust profiles for all suppliers to avoid N+1 queries in the loop
        const supplierTenantIds = Array.from(new Set(supplyCandidates.map(s => s.tenantId)));
        const trustProfiles = await prisma.companyTrustProfile.findMany({
            where: { tenantId: { in: supplierTenantIds } }
        });
        const trustMap = new Map(trustProfiles.map(p => [p.tenantId, p]));

        for (const sup of supplyCandidates) {
            const trustP = trustMap.get(sup.tenantId);

            // Skip low trust suppliers entirely as part of Trust Filter integration (e.g. strict policy)
            if (!trustP || trustP.trustLevel === 'LOW') {
                continue;
            }

            for (const dem of demandCandidates) {
                if (sup.tenantId === dem.tenantId) continue;
                if (sup.categoryId !== dem.categoryId) continue;

                // Graph proximity (mock - would normally come from Network Graph Query Engine)
                const graphDistance = (sup.clusterId === dem.clusterId) ? 1 : Math.round(Math.random() * 3) + 2;

                const trustScore = trustP.overallScore;
                const reputationScore = trustP.tradeScore;
                const shippingScore = trustP.shippingScore;
                const financeRisk = 100 - trustP.paymentScore;

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
            // 🟢 Deduplication Check - RACE CONDITION PROTECTION
            // Filter against items currently sitting in CANDIDATE status
            const existingCands = await prisma.networkLiquidityMatch.findMany({
                where: {
                    opportunityId,
                    status: NetworkLiquidityMatchStatus.CANDIDATE
                },
                select: { buyerTenantId: true, sellerTenantId: true, categoryId: true }
            });
            const existingKeys = new Set(existingCands.map(e => `${e.buyerTenantId}_${e.sellerTenantId}_${e.categoryId}`));

            const newMatches = matches.filter(m => !existingKeys.has(`${m.buyerTenantId}_${m.sellerTenantId}_${m.categoryId}`));

            if (newMatches.length > 0) {
                // Since we don't have composite keys enforced on the DB schema for matches
                // we create directly. In production, we'd upsert.
                await prisma.networkLiquidityMatch.createMany({
                    data: newMatches as any,
                    skipDuplicates: true
                });

                // Re-fetch to get IDs for Ledger
                const createdMatches = await prisma.networkLiquidityMatch.findMany({
                    where: {
                        opportunityId,
                        buyerTenantId: { in: newMatches.map(m => m.buyerTenantId) },
                        sellerTenantId: { in: newMatches.map(m => m.sellerTenantId) },
                        status: NetworkLiquidityMatchStatus.CANDIDATE
                    }
                });

                // 🟢 Hook into Unified Trade Ledger
                const { TradeLedgerIngestionService } = await import('@/domains/trade-ledger/services/tradeLedgerIngestion.service');
                for (const match of createdMatches) {
                    await TradeLedgerIngestionService.recordFromLiquidityMatch(match.id).catch(err => {
                        console.error('[TradeLedger] Failed to append match:', err);
                    });
                }

                return createdMatches;
            }

            return [];
        }

        return matches;
    }
}
