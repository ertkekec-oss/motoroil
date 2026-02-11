import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const companyId = session.user.companyId;

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
