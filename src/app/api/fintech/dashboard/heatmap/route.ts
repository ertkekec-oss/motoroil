import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const ctx = await getRequestContext(req as any);

        let companyId = ctx.companyId;

        if (!companyId) {
            // FALLBACK: If header is missing (e.g. Onboarding), try to find the default company for this tenant
            const defaultCompany = await (prisma as any).company.findFirst({
                where: { tenantId: ctx.tenantId }
            });

            if (!defaultCompany) {
                return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });
            }
            companyId = defaultCompany.id;
        }

        const pnlData = await (prisma as any).marketplaceProductPnl.findMany({
            where: { companyId },
            include: {
                product: {
                    select: {
                        name: true,
                        code: true,
                        category: true
                    }
                }
            },
            orderBy: { netProfit: 'desc' }
        });

        const heatmap = pnlData.map((s: any) => ({
            id: s.id,
            productId: s.productId,
            productName: s.product.name,
            productCode: s.product.code,
            category: s.product.category,
            marketplace: s.marketplace,
            grossRevenue: Number(s.grossRevenue),
            commission: Number(s.commissionTotal),
            shipping: Number(s.shippingTotal),
            otherFees: Number(s.otherFeesTotal),
            fifoCost: Number(s.fifoCostTotal),
            refunds: Number(s.refundCostTotal),
            netProfit: Number(s.netProfit),
            margin: Number(s.profitMargin),
            saleCount: s.saleCount,
            refundCount: s.refundCount,
            returnRate: s.saleCount > 0 ? (s.refundCount / s.saleCount) * 100 : 0
        }));

        return NextResponse.json({
            success: true,
            data: heatmap
        });

    } catch (error: any) {
        console.error('Heatmap API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
