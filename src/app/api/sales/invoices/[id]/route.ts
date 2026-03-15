import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, verifyWriteAccess } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        const invoice = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId },
            include: {
                customer: true,
            }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const writeCheck = verifyWriteAccess(auth.user);
        if (!writeCheck.authorized) return writeCheck.response;

        const { id } = await params;
        const body = await request.json();
        const { invoiceNo, invoiceDate, items, totalAmount, status } = body;

        // Ensure ownership
        const existing = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId }
        });
        if (!existing) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });

        const updatedInvoice = await prisma.salesInvoice.update({
            where: { id },
            data: {
                invoiceNo,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
                items,
                totalAmount,
                status
            }
        });

        return NextResponse.json({ success: true, invoice: updatedInvoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const writeCheck = verifyWriteAccess(auth.user);
        if (!writeCheck.authorized) return writeCheck.response;

        const { id } = await params;

        // Ensure ownership
        const invoice = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        if (invoice.status === 'İptal Edildi') {
            return NextResponse.json({ success: false, error: 'Fatura zaten iptal edilmiş' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Update invoice status to 'İptal Edildi' rather than hard-deleting
            await tx.salesInvoice.update({
                where: { id },
                data: {
                    status: 'İptal Edildi',
                    deletedAt: new Date()
                }
            });

            // Make sure we only reverse financials if the invoice was actually finalized (formal or approved/proforma that affected stock)
            if (invoice.isFormal || invoice.status === 'Onaylandı') {
                // 1. Revert Customer Balance
                await tx.customer.update({
                    where: { id: invoice.customerId },
                    data: { balance: { decrement: invoice.totalAmount } }
                });

                // 2. Remove related Transaction
                await tx.transaction.deleteMany({
                    where: {
                        customerId: invoice.customerId,
                        companyId: invoice.companyId,
                        type: 'SalesInvoice',
                        amount: invoice.totalAmount,
                        description: { contains: invoice.invoiceNo }
                    }
                });

                // 3. Revert Inventory / Stocks
                const items: any = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
                if (items && Array.isArray(items)) {
                    for (const item of items) {
                        if (item.productId) {
                            const pId = String(item.productId);
                            const qty = Number(item.qty);
                            
                            try {
                                await tx.product.update({
                                    where: { id: pId },
                                    data: { stock: { increment: qty } }
                                });
                                
                                await tx.stock.upsert({
                                    where: { productId_branch: { productId: pId, branch: invoice.branch || 'Merkez' } },
                                    update: { quantity: { increment: qty } },
                                    create: { productId: pId, branch: invoice.branch || 'Merkez', quantity: qty }
                                });
                                
                                await (tx as any).stockMovement.create({
                                    data: {
                                        productId: pId,
                                        branch: invoice.branch || 'Merkez',
                                        companyId: invoice.companyId,
                                        quantity: qty,
                                        price: item.price || 0,
                                        type: 'CANCEL',
                                        referenceId: invoice.id
                                    }
                                }).catch(() => {}); // Ignore missing model error
                            } catch (e) {
                                console.error("Stock reversal error on invoice cancel:", e);
                            }
                        }
                    }
                }
            }
        });

        const cancelMessage = invoice.isFormal 
            ? 'Resmi fatura sistemden iptal edildi. Lütfen e-belge portalınızdan (Nilvera/GİB) da faturayı resmi olarak reddediniz/iptal ediniz.'
            : 'Fatura iptal edildi.';

        return NextResponse.json({ success: true, message: cancelMessage });
    } catch (error: any) {
        console.error("Fatura İptal Hatası:", error);
        return NextResponse.json({ success: false, error: 'Fatura iptal edilirken sistemsel bir hata oluştu: ' + error.message }, { status: 500 });
    }
}
