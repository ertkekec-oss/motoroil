import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ActionProviderRegistry } from '@/services/marketplaces/actions/registry';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
        return NextResponse.json({ error: 'orderNumber required' }, { status: 400 });
    }

    try {
        const order = await prisma.marketplaceOrder.findFirst({
            where: { orderNumber },
            include: { company: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found in DB' }, { status: 404 });
        }

        const provider = ActionProviderRegistry.getProvider(order.marketplace);
        
        let rawResponse;
        
        try {
            rawResponse = await provider.executeAction({
               companyId: order.companyId,
               marketplace: order.marketplace as any,
               orderId: order.id,
               actionKey: "SYNC_SETTLEMENT",
               idempotencyKey: `MANUAL_SYNC_${order.orderNumber}_${Date.now()}`,
               payload: { 
                    orderNumber: order.orderNumber,
                    tenantId: order.tenantId,
                    channelId: order.channelId
               }
            });
        } catch(apiErr: any) {
             console.error("API ERROR:", apiErr);
             return NextResponse.json({ 
                 error: "Provider failed", 
                 message: apiErr.message, 
                 stack: apiErr.stack,
                 apiResponse: apiErr.response?.data
             }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            providerResult: rawResponse
        });

    } catch (error: any) {
        console.error('Force Settlement API Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
