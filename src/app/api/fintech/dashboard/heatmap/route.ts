import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const ctx = await getRequestContext(req as any);
        let companyId = ctx.companyId;

        if (!companyId) {
            const defaultCompany = await (prisma as any).company.findFirst({ where: { tenantId: ctx.tenantId } });
            if (!defaultCompany) return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });
            companyId = defaultCompany.id;
        }

        const url = new URL(req.url);
        const timeFilter = url.searchParams.get('time') || 'ALL'; // TODAY, 1W, 1M, 3M, 1Y, ALL

        const now = new Date();
        const dateOnlyToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        let startDate: Date | undefined = undefined;

        if (timeFilter !== 'ALL') {
            startDate = new Date(dateOnlyToday);
            if (timeFilter === 'TODAY') {
                // Today uses today's midnight
            } else if (timeFilter === '1W') {
                startDate.setDate(startDate.getDate() - 7);
            } else if (timeFilter === '1M') {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (timeFilter === '3M') {
                startDate.setMonth(startDate.getMonth() - 3);
            } else if (timeFilter === '1Y') {
                startDate.setFullYear(startDate.getFullYear() - 1);
            }
        }

        const dateFilter = startDate ? { gte: startDate } : undefined;

        // V2 Time-Series Veri Çekimi (Sadece istenen zaman dilimine ait Daily PNL satırları)
        const dailyPnls = await prisma.marketplaceProductDailyPnl.findMany({
            where: { 
                companyId,
                ...(dateFilter ? { date: dateFilter } : {})
            },
            include: {
                product: {
                    select: { name: true, code: true, category: true, brandId: true, brand: { select: { name: true } } }
                }
            }
        });

        // Ürün + Pazaryeri bazında topla (Data Cube Aggregation)
        const aggregated = new Map<string, any>();

        for (const p of dailyPnls) {
            const key = `${p.productId}_${p.marketplace}`;
            if (!aggregated.has(key)) {
                aggregated.set(key, {
                    id: key,
                    productId: p.productId,
                    productName: p.product.name,
                    productCode: p.product.code,
                    category: p.product.category,
                    brand: (p.product as any).brand?.name || 'GENEL',
                    marketplace: p.marketplace,
                    grossRevenue: 0, commission: 0, shipping: 0, otherFees: 0, penalty: 0,
                    fifoCost: 0, refunds: 0, saleCount: 0, refundCount: 0
                });
            }
            
            const agg = aggregated.get(key);
            agg.grossRevenue += Number(p.grossRevenue);
            agg.commission += Number(p.commissionTotal);
            agg.shipping += Number(p.shippingTotal);
            agg.otherFees += Number(p.otherFeesTotal);
            agg.penalty += Number(p.penaltyTotal);
            agg.fifoCost += Number(p.cogsAtSale); // Satıldığı andaki tarihi Cogs
            agg.saleCount += p.saleCount;
            agg.refunds += Number(p.refundCostTotal);
            agg.refundCount += p.refundCount;
        }

        const heatmapMap = Array.from(aggregated.values()).map(s => {
            const netProfit = s.grossRevenue - (s.commission + s.shipping + s.otherFees + s.penalty + s.fifoCost + s.refunds);
            const margin = s.grossRevenue > 0 ? (netProfit / s.grossRevenue) * 100 : 0;
            return {
                ...s,
                netProfit,
                margin,
                returnRate: s.saleCount > 0 ? (s.refundCount / s.saleCount) * 100 : 0
            };
        });

        // En çok Kar edenden (veya zarardan) sırala
        const sortedHeatmap = heatmapMap.sort((a, b) => b.netProfit - a.netProfit);

        return NextResponse.json({
            success: true,
            data: sortedHeatmap,
            metadata: { count: sortedHeatmap.length, timeFilter }
        });

    } catch (error: any) {
        console.error('Heatmap Aggregation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
