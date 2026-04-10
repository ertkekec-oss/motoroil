import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;

        // Fetch both completed orders and formal invoices to get purchased items
        const orders = await prisma.order.findMany({
            where: {
                customerId,
                status: {
                    in: ['Tamamlandı', 'Faturalandırıldı', 'COMPLETED', 'INVOICED', 'Sevk Edildi']
                }
            },
            select: { id: true, invoiceNo: true, createdAt: true, items: true, status: true, totalAmount: true }
        });

        const formalInvoices = await prisma.salesInvoice.findMany({
            where: {
                customerId,
                status: { notIn: ['İPTAL', 'CANCELLED'] }
            },
            select: { id: true, invoiceNo: true, invoiceDate: true, items: true, status: true, totalAmount: true }
        });

        const purchasedProducts: any[] = [];

        // Parse order items
        for (const order of orders) {
            let items = [];
            try {
                items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            } catch (e) {}

            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    purchasedProducts.push({
                        type: 'Order',
                        sourceId: order.id,
                        invoiceNo: order.invoiceNo || order.id.slice(-6).toUpperCase(),
                        date: order.createdAt,
                        productName: item.name || item.productName || 'Satın Alınan Ürün',
                        productId: item.productId,
                        price: item.price || item.unitPrice || 0,
                        qty: item.qty || item.quantity || 1
                    });
                });
            }
        }

        // Parse formal invoice items
        for (const invoice of formalInvoices) {
            let items = [];
            try {
                items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
            } catch (e) {}

            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    purchasedProducts.push({
                        type: 'Invoice',
                        sourceId: invoice.id,
                        invoiceNo: invoice.invoiceNo || invoice.id.slice(-6).toUpperCase(),
                        date: invoice.invoiceDate,
                        productName: item.name || item.productName || 'Faturalandırılan Ürün',
                        productId: item.productId,
                        price: item.price || item.unitPrice || 0,
                        qty: item.qty || item.quantity || 1
                    });
                });
            }
        }

        // Sort by date descending
        purchasedProducts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(purchasedProducts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
