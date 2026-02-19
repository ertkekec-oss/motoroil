import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { MarketplaceServiceFactory } from '@/services/marketplaces';

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { orderId, marketplace } = await request.json();

        if (!orderId || !marketplace) {
            return NextResponse.json({ success: false, error: 'orderId and marketplace are required' }, { status: 400 });
        }

        // 1. Fetch existing order to get companyId and orderNumber
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!existingOrder) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        if ((existingOrder as any).detailsFetchedAt && (existingOrder.items as any[]).length > 0) {
            const oneHourAgo = new Date(Date.now() - 3600000);
            if ((existingOrder as any).detailsFetchedAt > oneHourAgo) {
                return NextResponse.json({ success: true, order: existingOrder, skipped: true });
            }
        }

        // 2. Resolve internal marketplace type
        const mpMap: Record<string, string> = {
            'Pazarama': 'pazarama',
            'Trendyol': 'trendyol',
            'Hepsiburada': 'hepsiburada',
            'N11': 'n11',
            'Amazon': 'amazon'
        };

        const internalMpType = mpMap[marketplace] || marketplace.toLowerCase();

        // 3. Get Marketplace Config
        const mpConfig = await prisma.marketplaceConfig.findFirst({
            where: {
                companyId: existingOrder.companyId,
                type: internalMpType
            }
        });

        const actualConfig = mpConfig.settings || (mpConfig as any).config;

        if (!mpConfig || !actualConfig) {
            console.error(`[HYDRATE] Config not found for ${internalMpType} (Company: ${existingOrder.companyId})`);
            return NextResponse.json({
                success: false,
                error: `Marketplace config settings not found for ${internalMpType}. Lütfen entegrasyon ayarlarını kontrol edin.`
            }, { status: 400 });
        }

        // 4. Initialize Marketplace Service
        const service = MarketplaceServiceFactory.createService(
            mpConfig.type as any,
            actualConfig as any
        );

        // 4. Fetch Details from Marketplace
        console.log(`[HYDRATE] Fetching details for ${marketplace} order: ${existingOrder.orderNumber}`);
        const remoteOrder = await service.getOrderByNumber(existingOrder.orderNumber);

        if (!remoteOrder) {
            return NextResponse.json({ success: false, error: 'Could not fetch order details from marketplace' }, { status: 404 });
        }

        // 5. Update Local DB
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                items: remoteOrder.items as any,
                shippingAddress: remoteOrder.shippingAddress as any,
                invoiceAddress: remoteOrder.invoiceAddress as any,
                totalAmount: remoteOrder.totalAmount,
                customerName: remoteOrder.customerName,
                customerEmail: remoteOrder.customerEmail,
                status: remoteOrder.status, // Update status too
                rawData: remoteOrder as any, // Update raw data with full details
                detailsFetchedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            order: updatedOrder
        });

    } catch (error: any) {
        console.error('Marketplace Hydration Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
