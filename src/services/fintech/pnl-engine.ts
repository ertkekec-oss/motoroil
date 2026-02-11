import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class PnLEngine {
    /**
     * Incrementally updates product P&L metrics based on domain events.
     * Guaranteed to be idempotent if called within the same transaction as event recording.
     */
    static async updatePnl(tx: any, event: { companyId: string, eventType: string, payload: any }) {
        const { companyId, eventType, payload } = event;

        // 1. SALE_COMPLETED: Handle revenue, count, and FIFO cost
        if (eventType === 'SALE_COMPLETED') {
            const { productId, marketplace, saleAmount, fifoCost } = payload;
            if (!productId || !marketplace) return;

            await this.adjustMetrics(tx, companyId, productId, marketplace, {
                grossRevenue: new Decimal(saleAmount || 0),
                saleCount: 1,
                fifoCostTotal: new Decimal(fifoCost || 0)
            });
        }

        // 2. MARKETPLACE_TRANSACTION_RECORDED: Handle commissions, shipping, etc.
        if (eventType.includes('TRANSACTION_RECORDED')) {
            const { productId, marketplace, type, amount } = payload;
            if (!productId || !marketplace) return;

            const updates: any = {};
            const absAmount = new Decimal(amount || 0).abs();

            const txType = type?.toUpperCase();

            if (txType === 'COMMISSION') updates.commissionTotal = absAmount;
            if (txType === 'CARGO' || txType === 'SHIPPING') updates.shippingTotal = absAmount;
            if (txType === 'SERVICE_FEE' || txType === 'OTHER_FEE') updates.otherFeesTotal = absAmount;
            if (txType === 'REFUND') {
                updates.refundCostTotal = absAmount;
                updates.refundCount = 1;
            }

            if (Object.keys(updates).length > 0) {
                await this.adjustMetrics(tx, companyId, productId, marketplace, updates);
            }
        }

        // 3. REFUND_COMPLETED: Handle refund costs and counts
        if (eventType === 'REFUND_COMPLETED') {
            const { productId, marketplace, refundAmount } = payload;
            if (!productId || !marketplace) return;

            await this.adjustMetrics(tx, companyId, productId, marketplace, {
                refundCostTotal: new Decimal(refundAmount || 0),
                refundCount: 1
            });
        }
    }

    private static async adjustMetrics(tx: any, companyId: string, productId: string, marketplace: string, updates: any) {
        const existing = await tx.marketplaceProductPnl.findUnique({
            where: {
                companyId_productId_marketplace: { companyId, productId, marketplace }
            }
        });

        if (!existing) {
            await tx.marketplaceProductPnl.create({
                data: {
                    companyId,
                    productId,
                    marketplace,
                    grossRevenue: updates.grossRevenue || 0,
                    commissionTotal: updates.commissionTotal || 0,
                    shippingTotal: updates.shippingTotal || 0,
                    otherFeesTotal: updates.otherFeesTotal || 0,
                    fifoCostTotal: updates.fifoCostTotal || 0,
                    refundCostTotal: updates.refundCostTotal || 0,
                    saleCount: updates.saleCount || 0,
                    refundCount: updates.refundCount || 0,
                    refundedQuantity: updates.refundedQuantity || 0,
                    netProfit: 0,
                    profitMargin: 0
                }
            });
        } else {
            const data: any = {};
            if (updates.grossRevenue) data.grossRevenue = { increment: updates.grossRevenue };
            if (updates.commissionTotal) data.commissionTotal = { increment: updates.commissionTotal };
            if (updates.shippingTotal) data.shippingTotal = { increment: updates.shippingTotal };
            if (updates.otherFeesTotal) data.otherFeesTotal = { increment: updates.otherFeesTotal };
            if (updates.fifoCostTotal) data.fifoCostTotal = { increment: updates.fifoCostTotal };
            if (updates.refundCostTotal) data.refundCostTotal = { increment: updates.refundCostTotal };
            if (updates.saleCount) data.saleCount = { increment: updates.saleCount };
            if (updates.refundCount) data.refundCount = { increment: updates.refundCount };
            if (updates.refundedQuantity) data.refundedQuantity = { increment: updates.refundedQuantity };

            await tx.marketplaceProductPnl.update({
                where: { id: existing.id },
                data
            });
        }

        // Recalculate Net Profit and Margin for health monitoring
        const latest = await tx.marketplaceProductPnl.findUnique({
            where: { companyId_productId_marketplace: { companyId, productId, marketplace } }
        });

        // FORMULA: Realized Profit
        // Net Revenue = Gross Sales - Returns
        // Net Cost = FIFO Cost - (Cost of Returned Items - if back in stock)
        // Fees = Commission + Shipping + Other

        const gross = Number(latest.grossRevenue);
        const refunds = Number(latest.refundCostTotal);
        const fees = Number(latest.commissionTotal)
            + Number(latest.shippingTotal)
            + Number(latest.otherFeesTotal);
        const inventoryCost = Number(latest.fifoCostTotal);

        const netProfit = gross - refunds - inventoryCost - fees;
        const netRevenue = gross - refunds;
        const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

        await tx.marketplaceProductPnl.update({
            where: { id: latest.id },
            data: {
                netProfit: new Decimal(netProfit),
                profitMargin: new Decimal(margin)
            }
        });
    }
}
