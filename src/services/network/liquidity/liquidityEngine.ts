import { PrismaClient, NetworkLiquidityOpportunityType, NetworkLiquidityOpportunityStatus } from '@prisma/client';
import { SupplyDetector } from './supplyDetector';
import { DemandDetector } from './demandDetector';
import { MatchEngine } from './matchEngine';
import { AutoTradePolicy } from './autoTradePolicy';

const prisma = new PrismaClient();

export class LiquidityEngine {
    static generateDedupeKey(tenantId: string, role: 'SUPPLY' | 'DEMAND', categoryId: string) {
        return `LIQ_${role}_${tenantId}_${categoryId}_${new Date().toISOString().split('T')[0]}`;
    }

    static async scanAndLogSupply(categoryId?: string, regionCode?: string) {
        const supplies = await SupplyDetector.detectSupplySurplus(categoryId, regionCode);

        for (const sup of supplies) {
            const dedupeKey = this.generateDedupeKey(sup.tenantId, 'SUPPLY', sup.categoryId || 'none');

            await prisma.networkLiquidityOpportunity.upsert({
                where: { dedupeKey },
                update: {
                    liquidityVolumeScore: sup.volumeScore,
                    updatedAt: new Date()
                },
                create: {
                    supplyTenantId: sup.tenantId,
                    categoryId: sup.categoryId,
                    productRef: sup.productRef,
                    regionCode: sup.regionCode,
                    clusterId: sup.clusterId,
                    opportunityType: NetworkLiquidityOpportunityType.SUPPLY_SURPLUS,
                    liquidityVolumeScore: sup.volumeScore,
                    dedupeKey,
                    calculationVersion: '1.0.0',
                    explainJson: { source: 'SCAN_SUPPLY' }
                }
            });
        }
        return supplies.length;
    }

    static async scanAndLogDemand(categoryId?: string, regionCode?: string) {
        const demands = await DemandDetector.detectDemandShortage(categoryId, regionCode);

        for (const dem of demands) {
            const dedupeKey = this.generateDedupeKey(dem.tenantId, 'DEMAND', dem.categoryId || 'none');

            await prisma.networkLiquidityOpportunity.upsert({
                where: { dedupeKey },
                update: {
                    liquidityVolumeScore: dem.volumeScore,
                    updatedAt: new Date()
                },
                create: {
                    demandTenantId: dem.tenantId,
                    categoryId: dem.categoryId,
                    productRef: dem.productRef,
                    regionCode: dem.regionCode,
                    clusterId: dem.clusterId,
                    opportunityType: NetworkLiquidityOpportunityType.DEMAND_SHORTAGE,
                    liquidityVolumeScore: dem.volumeScore,
                    dedupeKey,
                    calculationVersion: '1.0.0',
                    explainJson: { source: 'SCAN_DEMAND' }
                }
            });
        }
        return demands.length;
    }

    static async processLiquidityMatches() {
        const [openSupplies, openDemands] = await Promise.all([
            prisma.networkLiquidityOpportunity.findMany({
                where: { opportunityType: NetworkLiquidityOpportunityType.SUPPLY_SURPLUS, status: NetworkLiquidityOpportunityStatus.DISCOVERED }
            }),
            prisma.networkLiquidityOpportunity.findMany({
                where: { opportunityType: NetworkLiquidityOpportunityType.DEMAND_SHORTAGE, status: NetworkLiquidityOpportunityStatus.DISCOVERED }
            })
        ]);

        let matchCount = 0;

        for (const sup of openSupplies) {
            if (!sup.categoryId) continue;

            const matchedDemands = openDemands.filter(d => d.categoryId === sup.categoryId);

            if (matchedDemands.length > 0) {
                // Ensure allowed by policy before generating deep matching logic
                if (AutoTradePolicy.assertLiquidityActionAllowed(sup.supplyTenantId!, 'DISCOVER')) {
                    const mappedSup = { tenantId: sup.supplyTenantId!, categoryId: sup.categoryId, productRef: sup.productRef || undefined, volumeScore: sup.liquidityVolumeScore, clusterId: sup.clusterId || undefined };

                    const mappedDems = matchedDemands.map(d => ({
                        tenantId: d.demandTenantId!,
                        categoryId: d.categoryId || undefined,
                        productRef: d.productRef || undefined,
                        volumeScore: d.liquidityVolumeScore,
                        clusterId: d.clusterId || undefined
                    }));

                    const generated = await MatchEngine.generateLiquidityMatches(sup.id, [mappedSup], mappedDems);

                    if (generated.length > 0) {
                        matchCount += generated.length;
                        await prisma.networkLiquidityOpportunity.update({
                            where: { id: sup.id },
                            data: { status: NetworkLiquidityOpportunityStatus.RANKED }
                        });
                    }
                }
            }
        }

        return { matchedCount: matchCount };
    }
}
