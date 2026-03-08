import prisma from '@/lib/prisma';
import { NetworkGrowthTriggerService } from './networkGrowthTrigger.service';

export class NetworkGrowthService {
    static async evaluateGrowthTriggersFromCompletedTrade(tradeContext: any) {
        console.log('[NetworkGrowth] Evaluating growth triggers for completed trade...', tradeContext);

        // Suggest supplier expansion to buyer
        if (tradeContext.buyerTenantId && tradeContext.sellerTenantId) {
            await NetworkGrowthTriggerService.createGrowthTrigger({
                buyerTenantId: tradeContext.buyerTenantId,
                sellerTenantId: tradeContext.sellerTenantId,
                canonicalProductId: tradeContext.canonicalProductId, // Approximation
                triggerType: 'TRADE_COMPLETED_BUYER_EXPANSION',
                triggerStrength: 85,
                metadataJson: { reason: "Trade successful, expanding buyer options" }
            });

            // Suggest buyer expansion to supplier
            await NetworkGrowthTriggerService.createGrowthTrigger({
                buyerTenantId: tradeContext.buyerTenantId,
                sellerTenantId: tradeContext.sellerTenantId,
                canonicalProductId: tradeContext.canonicalProductId,
                triggerType: 'TRADE_COMPLETED_SUPPLIER_EXPANSION',
                triggerStrength: 85,
                metadataJson: { reason: "Trade successful, expanding sales channels" }
            });
        }
    }

    static async evaluateGrowthTriggersFromLiquidityPattern(canonicalProductId: string, signalType: 'HIGH_DEMAND' | 'OVERSTOCK') {
        // Determine if high demand or high supply patterns justify an outreach/trigger
        console.log(`[NetworkGrowth] Evaluating ${signalType} for product ${canonicalProductId}`);
        await NetworkGrowthTriggerService.createGrowthTrigger({
            canonicalProductId,
            triggerType: signalType === 'HIGH_DEMAND' ? 'HIGH_DEMAND_SUPPLIER_DISCOVERY' : 'HIGH_SUPPLY_BUYER_DISCOVERY',
            triggerStrength: 90,
            metadataJson: { reason: "Pattern detected" }
        });
    }
}
