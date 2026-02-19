import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;
        const session = auth.user;

        // Robust Company Resolution: Prioritize session.companyId
        let companyId = session.impersonateTenantId ? null : (session as any).companyId;

        if (!companyId) {
            const targetTenantId = session.impersonateTenantId || session.tenantId;
            // Fallback: Find first company for the tenant
            const company = await prisma.company.findFirst({
                where: { tenantId: targetTenantId }
            });
            companyId = company?.id;
        }

        if (!companyId) {
            return NextResponse.json({ success: true, count: 0, orders: [] });
        }

        // Son 24 saatteki "Yeni" veya "Hazırlanıyor" statüsündeki siparişleri çek
        // Not: Pazaryerine göre statü isimleri değişebilir (Created, Picking vb.)
        // Son siparişleri çek (Statü farketmeksizin hepsini getir ki entegrasyonu görelim)
        const { searchParams } = new URL(request.url);
        const marketplaceParam = searchParams.get('marketplace');

        const KEY_TO_DISPLAY: Record<string, string> = {
            trendyol: "Trendyol",
            hepsiburada: "Hepsiburada",
            n11: "N11",
            pazarama: "Pazarama",
            amazon: "Amazon",
            pos: "POS",
        };

        function normalizeMarketplaceFilter(mp: string) {
            const trimmed = mp.trim();
            if (!trimmed) return trimmed;
            const key = trimmed.toLowerCase();
            if (KEY_TO_DISPLAY[key]) return KEY_TO_DISPLAY[key];
            if (trimmed.toUpperCase() === "POS") return "POS";
            return trimmed;
        }

        let whereClause: any = {
            companyId: companyId
        };

        if (marketplaceParam) {
            whereClause.marketplace = normalizeMarketplaceFilter(marketplaceParam);
        } else {
            whereClause.marketplace = { not: 'POS' }; // POS satışları 'Mağaza Satışları' sekmesinde, burası E-Ticaret
        }

        const pendingOrders = await prisma.order.findMany({
            where: whereClause,
            orderBy: {
                orderDate: 'desc'
            },
            take: 50
        });

        // Bildirim için sayı ve özet bilgi dön
        return NextResponse.json({
            success: true,
            count: pendingOrders.length,
            orders: pendingOrders,
            debug: {
                resolvedCompanyId: companyId,
                sessionTenantId: session.tenantId,
                totalTenantOrders
            }
        });
    } catch (error: any) {
        console.error('Pending Orders Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
