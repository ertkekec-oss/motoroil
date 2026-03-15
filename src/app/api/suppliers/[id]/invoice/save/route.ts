import { NextResponse, NextRequest } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: supplierId } = await params;
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user.user || auth.user;

    try {
        const company = await prisma.company.findFirst({
            where: { tenantId: session.tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const body = await req.json();
        const { invoiceNo, invoiceDate, items, totalAmount } = body;

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.companyId !== company.id) {
            return NextResponse.json({ success: false, error: 'Yetkisiz işlem veya tedarikçi bulunamadı.' }, { status: 403 });
        }

        // 1. Process items and map/create products
        const processedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            // Match product by code or name
            let product = await prisma.product.findFirst({
                where: {
                    companyId: company.id,
                    OR: [
                        { code: item.code },
                        { name: item.name }
                    ]
                }
            });

            if (!product) {
                // Create product if not found
                product = await prisma.product.create({
                    data: {
                        name: item.name,
                        code: item.code || `PRD-${Math.floor(Math.random() * 100000)}`,
                        companyId: company.id,
                        price: item.price * 1.2, // Default 20% margin
                        buyPrice: item.price,
                        stock: item.qty, // Init stock
                        category: 'Otomatik',
                        type: 'Diğer',
                        supplierName: supplier.name
                    }
                });
            } else {
                // Update stock and buy price of existing product
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        stock: { increment: item.qty },
                        buyPrice: item.price
                    }
                });
            }

            processedItems.push({
                productId: product.id,
                name: product.name,
                code: product.code,
                qty: item.qty,
                price: item.price,
                total: item.qty * item.price
            });

            calculatedTotal += (item.qty * item.price);
        }

        const finalTotalAmount = totalAmount > 0 ? totalAmount : calculatedTotal;
        let newBalance = Number(supplier.balance) - finalTotalAmount;

        // 2. Create Purchase Invoice and Transaction
        await prisma.$transaction([
            prisma.purchaseInvoice.create({
                data: {
                    companyId: company.id,
                    supplierId,
                    invoiceNo: invoiceNo || `INV-${Date.now()}`,
                    invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                    amount: finalTotalAmount,
                    taxAmount: 0,
                    totalAmount: finalTotalAmount,
                    description: 'Otomatik PDF Fatura Yüklemesi',
                    status: 'Onaylandı',
                    items: processedItems
                }
            }),
            prisma.transaction.create({
                data: {
                    companyId: company.id,
                    type: 'Purchase',
                    amount: finalTotalAmount,
                    description: `PDF Fatura Yüklemesi (${invoiceNo})`,
                    supplierId: supplierId,
                    branch: (session as any).branch || 'Merkez'
                }
            }),
            prisma.supplier.update({
                where: { id: supplierId },
                data: { balance: newBalance }
            })
        ]);

        return NextResponse.json({ success: true, balance: newBalance });

    } catch (error: any) {
        console.error("Save Parsed Invoice ERror:", error);
        return NextResponse.json({ success: false, error: 'Sistem hatası: ' + error.message }, { status: 500 });
    }
}
