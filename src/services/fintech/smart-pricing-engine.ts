import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { EventBus } from './event-bus';

export class SmartPricingEngine {
    /**
     * Evaluates all active pricing rules and triggers recommendations.
     * This can be called by a cron job or triggered by P&L updates.
     */
    static async evaluateAll(companyId: string) {
        const rules = await (prisma as any).smartPricingRule.findMany({
            where: { companyId, isActive: true },
            include: { product: true }
        });

        const autopilotConfigs = await (prisma as any).pricingAutopilotConfig.findMany({
            where: { companyId, enabled: true }
        });

        const updates = [];
        for (const rule of rules) {
            try {
                const recommendation = await this.getRecommendation(rule);
                if (recommendation) {
                    updates.push(recommendation);

                    const config = autopilotConfigs.find((c: any) => c.marketplace === rule.marketplace);
                    const authDecision = await this.checkAutopilotGuards(rule, recommendation, config);

                    if (authDecision.shouldPush) {
                        await this.pushPriceToMarketplace(rule, recommendation);
                    } else {
                        // Standard recommendation event
                        await EventBus.emit({
                            companyId: rule.companyId,
                            eventType: 'PRICE_RECOMMENDATION_GENERATED',
                            aggregateType: 'PRODUCT',
                            aggregateId: rule.productId,
                            payload: recommendation,
                            metadata: { ruleId: rule.id, reason: authDecision.reason }
                        });
                    }
                }
            } catch (err) {
                console.error(`SmartPricing error for rule ${rule.id}:`, err);
            }
        }
        return updates;
    }

    /**
     * Checks if a price recommendation should be automatically pushed.
     */
    private static async checkAutopilotGuards(rule: any, recommendation: any, config: any) {
        if (!config || !config.enabled) return { shouldPush: false, reason: 'AUTOPILOT_DISABLED' };

        // 1. Get P&L for return rate and margin checks
        const pnl = await (prisma as any).marketplaceProductPnl.findUnique({
            where: {
                companyId_productId_marketplace: {
                    companyId: rule.companyId,
                    productId: rule.productId,
                    marketplace: rule.marketplace
                }
            }
        });

        if (!pnl) return { shouldPush: false, reason: 'NO_PNL_DATA' };

        // Guard A: Return Rate (> 8%)
        const returnRate = pnl.saleCount > 0 ? (pnl.refundCount / pnl.saleCount) * 100 : 0;
        if (config.pauseOnHighReturnRate && returnRate > 8) {
            return { shouldPush: false, reason: 'HIGH_RETURN_RATE' };
        }

        // Guard B: Stock Level (< minStock)
        if (config.pauseOnNegativeStock && rule.product.stock <= rule.product.minStock) {
            return { shouldPush: false, reason: 'LOW_STOCK' };
        }

        // Guard C: Net Profit (< 0)
        if (Number(pnl.netProfit) < 0) {
            await this.logAudit(rule.companyId, 'PRICE_AUTOPILOT_PAUSED', {
                productId: rule.productId,
                reason: 'NEGATIVE_NET_PROFIT',
                pnlId: pnl.id
            });
            return { shouldPush: false, reason: 'NEGATIVE_PROFIT' };
        }

        // Guard D: Max Daily Change
        const changePercent = Math.abs((recommendation.recommendedPrice - recommendation.currentPrice) / recommendation.currentPrice) * 100;
        if (changePercent > Number(config.maxDailyChangePct)) {
            return { shouldPush: false, reason: 'MAX_DAILY_CHANGE_EXCEEDED' };
        }

        return { shouldPush: true, reason: 'APPROVED' };
    }

    /**
     * Simulates pushing price to marketplace API.
     */
    private static async pushPriceToMarketplace(rule: any, recommendation: any) {
        // In production, this would call Trendyol/Hepsiburada API
        console.log(`[AUTOPILOT] Pushing price to ${rule.marketplace}: ${recommendation.productName} -> ${recommendation.recommendedPrice}`);

        // Update local price (source of truth update)
        await (prisma as any).product.update({
            where: { id: rule.productId },
            data: { price: recommendation.recommendedPrice }
        });

        // Log the action
        await this.logAudit(rule.companyId, 'PRICE_AUTOPILOT_PUSHED', {
            ruleId: rule.id,
            productId: rule.productId,
            before: recommendation.currentPrice,
            after: recommendation.recommendedPrice,
            marketplace: rule.marketplace
        });

        // Emit success event
        await EventBus.emit({
            companyId: rule.companyId,
            eventType: 'PRICE_AUTOPILOT_PUSHED',
            aggregateType: 'PRODUCT',
            aggregateId: rule.productId,
            payload: recommendation
        });
    }

    private static async logAudit(companyId: string, action: string, details: any) {
        await (prisma as any).fintechAudit.create({
            data: {
                companyId,
                who: 'system',
                action,
                details: JSON.stringify(details),
                createdAt: new Date()
            }
        });
    }

    /**
     * Calculates the ideal price based on FIFO cost, existing commission fees and target margin.
     * Formula: Price = (FIFO Cost + Fixed Fees) / (1 - CommissionRate - TargetMargin)
     */
    static async getRecommendation(rule: any) {
        // 1. Get current P&L status for the product
        const pnl = await (prisma as any).marketplaceProductPnl.findUnique({
            where: {
                companyId_productId_marketplace: {
                    companyId: rule.companyId,
                    productId: rule.productId,
                    marketplace: rule.marketplace
                }
            }
        });

        if (!pnl || pnl.saleCount === 0) return null;

        // 2. Extract unit costs/fees from P&L (averages)
        const avgFifoCost = Number(pnl.fifoCostTotal) / pnl.saleCount;
        const avgCommissionRate = Number(pnl.commissionTotal) / Number(pnl.grossRevenue);
        const avgOtherFees = (Number(pnl.shippingTotal) + Number(pnl.otherFeesTotal)) / pnl.saleCount;

        const targetMargin = Number(rule.targetMargin) / 100;

        // 3. Calculate Recommended Price
        // P = (Cost + OtherFixedFees) / (1 - CommRate - TargetMargin)
        const denominator = 1 - avgCommissionRate - targetMargin;

        if (denominator <= 0) return null; // Impossible margin target

        let recommendedPrice = (avgFifoCost + avgOtherFees) / denominator;

        // 4. Apply Min/Max constraints
        const min = Number(rule.minPrice);
        const max = Number(rule.maxPrice);

        const originalPrice = recommendedPrice;
        recommendedPrice = Math.max(min, Math.min(max, recommendedPrice));

        // 5. Check if adjustment is needed (e.g., > 1% change)
        const currentPrice = Number(rule.product.price);
        const changePercent = Math.abs((recommendedPrice - currentPrice) / currentPrice);

        if (changePercent < 0.01) return null; // Ignore minor fluctuations

        return {
            productId: rule.productId,
            productName: rule.product.name,
            marketplace: rule.marketplace,
            currentPrice,
            recommendedPrice: Number(recommendedPrice.toFixed(2)),
            targetMargin: rule.targetMargin,
            isConstrained: recommendedPrice !== originalPrice,
            reason: recommendedPrice > currentPrice ? 'Margin Protection' : 'Price Optimization'
        };
    }
}
