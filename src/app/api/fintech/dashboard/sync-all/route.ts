import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { ActionProviderRegistry } from '@/services/marketplaces/actions/registry';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext(req as any);
        let companyId = ctx.companyId;

        if (!companyId) {
            const defaultCompany = await (prisma as any).company.findFirst({
                where: { tenantId: ctx.tenantId }
            });
            if (!defaultCompany) {
                return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 });
            }
            companyId = defaultCompany.id;
        }

        // Bul: Teslim edilmiş ama son 7 gündeki siparişler, işlemi PENDING/FAILED olanlar veya henüz hiç sync atılmamış olanlar
        // For demonstration, let's just grab the most recent 10 'DELIVERED' or 'TAMAMLANDI' orders
        const orders = await prisma.order.findMany({
            where: {
                companyId,
                status: {
                    in: ['Teslim Edildi', 'DELIVERED', 'TAMAMLANDI', 'Delivered']
                }
            },
            orderBy: { orderDate: 'desc' },
            take: 10
        });

        if (orders.length === 0) {
            return NextResponse.json({ success: true, synced: 0, message: "Senkronize edilecek teslim edilmiş sipariş bulunamadı." });
        }

        let syncedCount = 0;
        let errorCount = 0;
        let details: string[] = [];

        // We process in parallel, but limit concurrency so Vercel doesn't timeout
        for (const order of orders) {
            try {
                const mk = order.marketplace?.toLowerCase() as any;
                if (!['trendyol', 'hepsiburada', 'n11'].includes(mk)) continue;

                const provider = ActionProviderRegistry.getProvider(mk);
                
                const res = await provider.executeAction({
                    companyId: order.companyId,
                    marketplace: mk,
                    orderId: order.id,
                    actionKey: 'SYNC_SETTLEMENT' as any,
                    idempotencyKey: `SYNC_NOW_${order.id}_${Date.now()}` // using fresh key to force retry
                });

                if (res.status === 'SUCCESS') {
                    syncedCount++;
                    details.push(`[${mk}] Sipariş ${order.orderNumber}: Senkronize edildi.`);
                } else if (res.status === 'PENDING') {
                     // Still processing in queue or lock
                     details.push(`[${mk}] Sipariş ${order.orderNumber}: Kuyrukta/Kilitli.`);
                } else {
                    errorCount++;
                    details.push(`[${mk}] Sipariş ${order.orderNumber} Hata: ${res.errorMessage}`);
                }
            } catch (err: any) {
                errorCount++;
                details.push(`Sipariş ${order.orderNumber} Çalışma Hatası: ${err.message}`);
                console.error("Sync All Error on Order:", order.orderNumber, err);
            }
        }

        return NextResponse.json({
            success: true,
            synced: syncedCount,
            errors: errorCount,
            details,
            message: `${orders.length} sipariş tarandı. ${syncedCount} tanesi başarıyla kârlılığa yansıdı.`
        });

    } catch (error: any) {
        console.error('Manual Sync API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
