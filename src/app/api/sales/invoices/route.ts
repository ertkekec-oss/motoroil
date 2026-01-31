
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branch = searchParams.get('branch');

        const where = branch && branch !== 'Tümü' && branch !== 'all' ? { branch } : {};

        const invoices = await prisma.salesInvoice.findMany({
            where,
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, invoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            customerId,
            items,
            amount,
            taxAmount,
            totalAmount,
            description,
            isFormal = false,
            status = 'Taslak',
            branch
        } = body;

        // Validation
        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Müşteri ve ürün bilgileri zorunludur.' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Find customer to get their branch if not provided
            const customer = await tx.customer.findUnique({ where: { id: customerId } });

            // 1. Create Invoice
            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    customerId,
                    amount,
                    taxAmount,
                    totalAmount,
                    description,
                    items: items,
                    isFormal: isFormal || status === 'Onaylandı',
                    status: status,
                    branch: branch || customer?.branch || 'Merkez'
                }
            });

            // 2. If Invoice is Approved/Formal, Update Customer Balance & Stock
            if (isFormal || status === 'Onaylandı') {
                // A. Update Customer Balance
                await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { increment: parseFloat(totalAmount.toString()) } }
                });

                // B. Create Financial Transaction Record
                const defaultKasa = await tx.kasa.findFirst();
                if (defaultKasa) {
                    await tx.transaction.create({
                        data: {
                            type: 'SalesInvoice',
                            amount: totalAmount,
                            description: `Faturalı Satış: ${invoice.invoiceNo}`,
                            kasaId: defaultKasa.id.toString(),
                            customerId: customerId,
                            date: new Date()
                        }
                    });
                }

                // C. Update Stock (Inventory) - WITH ERROR HANDLING
                for (const item of items) {
                    if (item.productId) {
                        try {
                            const pId = String(item.productId);
                            await tx.product.update({
                                where: { id: pId },
                                data: { stock: { decrement: Number(item.qty) } }
                            });
                        } catch (stockErr) {
                            console.warn(`Stok güncelleme hatası (Ürün ID: ${item.productId}) - Devam ediliyor.`);
                            // Stok hatası faturayı engellemesin
                        }
                    }
                }
            }

            return invoice;
        });

        return NextResponse.json({ success: true, invoice: result });

    } catch (error: any) {
        console.error('Invoice Creation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
