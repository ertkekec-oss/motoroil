import { NextResponse } from 'next/server';
import { QCommerceWorkflow } from '@/services/qcommerce/workflow';

// Webhook for PayTR or equivalent gateway when order is paid
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Bu örnek bir Payload'dır (Ödemesi %100 tahsil edilmiş ve onaylanmış Online Sipariş)
        const { companyId, customerName, totalAmount, items, deliveryAddress } = body;

        // 1. Önce Siparişi "NEW" Olarak KDS'ye Yolla + Fatura Kes + Yevmiye Fişlemesi Yap
        const order = await QCommerceWorkflow.onPaymentReceivedCreateOrder({
            companyId,
            customerName,
            totalAmount,
            items,
            deliveryAddress
        });

        // İdeal senaryoda Pusher.js ile Mutfak Ekranı'na event fırlatıyoruz:
        // await pusherServer.trigger(`kds-${companyId}`, 'new-order', order);

        return NextResponse.json({ success: true, orderId: order.id, message: "Sipariş mutfağa ulaştı!" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
