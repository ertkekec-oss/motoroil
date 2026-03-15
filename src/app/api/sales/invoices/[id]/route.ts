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

        // Prevent cancellation if an active PaymentPlan is attached
        const activePlan = await prisma.paymentPlan.findFirst({
            where: {
                OR: [
                    { description: invoice.orderId ?? undefined },
                    { description: invoice.id }
                ],
                status: { not: 'İptal' }
            }
        });

        if (activePlan) {
            return NextResponse.json({ 
                success: false, 
                error: 'Bu faturaya/siparişe bağlı aktif bir vadelendirme planı bulunuyor. Önce işlemi geri almak için İptal butonunu kullanarak vadelendirmeyi iptal etmelisiniz.' 
            }, { status: 400 });
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
                if (invoice.orderId) {
                    // This invoice is tied to a POS Order! 
                    // The POS Order originally decremented stock and handled Kasa / Customer Balance.
                    // We must cancel the POS Order to properly revert everything.
                    
                    const order = await tx.order.findUnique({ where: { id: invoice.orderId } });
                    if (order && order.deletedAt === null) {
                        // 1. Revert Stocks (from Order items)
                        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                        const targetBranch = order.branch || 'Merkez';
                        if (Array.isArray(orderItems)) {
                            for (const item of orderItems) {
                                if (item.productId) {
                                    const qty = Number(item.qty || item.quantity || 1);
                                    try {
                                        await tx.stock.upsert({
                                            where: { productId_branch: { productId: String(item.productId), branch: targetBranch } },
                                            update: { quantity: { increment: qty } },
                                            create: { productId: String(item.productId), branch: targetBranch, quantity: qty }
                                        });

                                        await (tx as any).stockMovement.create({
                                            data: {
                                                productId: String(item.productId),
                                                branch: targetBranch,
                                                companyId: order.companyId,
                                                quantity: qty,
                                                type: 'RETURN',
                                                referenceId: order.id,
                                                price: Number(item.price || 0)
                                            }
                                        }).catch(() => {});

                                        if (targetBranch === 'Merkez') {
                                            await tx.product.update({
                                                where: { id: String(item.productId) },
                                                data: { stock: { increment: qty } }
                                            });
                                        }
                                    } catch (e) {
                                        console.error("Stock reversal error:", e);
                                    }
                                }
                            }
                        }

                        // 2. Revert Kasa & Financial Transaction
                        const transactions = await tx.transaction.findMany({
                            where: { description: { contains: `REF:${order.id}` } }
                        });

                        for (const t of transactions) {
                            if (t.type === 'Sales' || t.type === 'Collection') {
                                await tx.kasa.update({
                                    where: { id: t.kasaId },
                                    data: { balance: { decrement: t.amount } }
                                });
                            } else if (t.type === 'Expense') {
                                await tx.kasa.update({
                                    where: { id: t.kasaId },
                                    data: { balance: { increment: t.amount } }
                                });
                            }
                            
                            if (t.customerId && t.type === 'Sales') {
                                let rawData: any = order.rawData || {};
                                if (typeof rawData === 'string') {
                                    try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                                }
                                if (rawData.paymentMode === 'account') {
                                    await tx.customer.update({
                                        where: { id: t.customerId },
                                        data: { balance: { decrement: t.amount } }
                                    });
                                }
                            } else if (t.customerId && t.type === 'Collection') {
                                // Revert Collection -> Customer debt goes UP again
                                await tx.customer.update({
                                    where: { id: t.customerId },
                                    data: { balance: { increment: t.amount } }
                                });
                            }
                            await tx.transaction.update({
                                where: { id: t.id },
                                data: { deletedAt: new Date() }
                            });
                        }

                        // 2.5 Revert Points and Coupons
                        let rawData: any = order.rawData || {};
                        if (typeof rawData === 'string') {
                            try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                        }

                        // Find customerId from transactions since Order schema doesn't have it natively
                        const customerId = invoice.customerId || transactions.find((tr) => tr.customerId)?.customerId;

                        if (customerId) {
                            const earnedPoints = Number(rawData.dynamicEarnedPoints || 0);
                            const usedPoints = Number(rawData.pointsUsed || 0);
                            const netPointsToRevert = earnedPoints - usedPoints;

                            if (netPointsToRevert !== 0) {
                                await tx.customer.update({
                                    where: { id: customerId },
                                    data: { points: { decrement: netPointsToRevert } }
                                });
                            }
                        }

                        if (rawData.couponCode) {
                            const coupon = await tx.coupon.findUnique({ where: { code: rawData.couponCode } }) as any;
                            if (coupon) {
                                await tx.coupon.update({
                                    where: { code: rawData.couponCode },
                                    data: {
                                        usedCount: Math.max(0, (coupon.usedCount || 0) - 1),
                                        isUsed: (coupon.usedCount || 0) <= 1 ? false : true
                                    }
                                });
                            }
                        }

                        // 3. Accounting Reversal (Storno)
                        try {
                            const { stornoJournalEntry } = await import('@/lib/accounting');
                            const journal = await tx.journal.findFirst({
                                where: { sourceId: order.id, sourceType: 'Order' }
                            });
                            if (journal) {
                                await stornoJournalEntry(journal.id, 'Fatura İptal Edildi (Bağlı POS Siparişi)');
                            }

                            // Also storno journals of related transactions (Commissions, etc)
                            for (const t of transactions) {
                                const tJournal = await tx.journal.findFirst({
                                    where: { sourceId: t.id, sourceType: 'Transaction' }
                                });
                                if (tJournal) {
                                    await stornoJournalEntry(tJournal.id, `İşlem İptal Edildi (Fatura İptali REF:${order.id})`);
                                }
                            }
                        } catch (err) {
                            console.error('[Accounting Reversal Error]:', err);
                        }

                        // 4. Mark Order as deleted
                        await tx.order.update({
                            where: { id: order.id },
                            data: {
                                deletedAt: new Date(),
                                status: 'İptal Edildi'
                            }
                        });
                    }
                } else {
                    // STANDALONE INVOICE Reversal Logic
                    // 1. Revert Customer Balance
                    await tx.customer.update({
                        where: { id: invoice.customerId },
                        data: { balance: { decrement: invoice.totalAmount } }
                    });

                    // 2. Soft Delete related Transaction
                    await tx.transaction.updateMany({
                        where: {
                            customerId: invoice.customerId,
                            companyId: invoice.companyId,
                            type: 'SalesInvoice',
                            amount: invoice.totalAmount,
                            description: { contains: invoice.invoiceNo }
                        },
                        data: { deletedAt: new Date() }
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
                                    }).catch(() => {});
                                } catch (e) {
                                    console.error("Stock reversal error on invoice cancel:", e);
                                }
                            }
                        }
                    }

                    // 4. Accounting Reversal (Storno)
                    try {
                        const { stornoJournalEntry } = await import('@/lib/accounting');
                        
                        // Check for journals tied to the invoice itself
                        const invJournal = await tx.journal.findFirst({
                            where: { sourceId: invoice.id, sourceType: { in: ['Invoice', 'SalesInvoice'] } }
                        });
                        if (invJournal) {
                            await stornoJournalEntry(invJournal.id, `Fatura İptal Edildi (${invoice.invoiceNo})`);
                        }

                        // Check for journals tied to related transactions
                        const relatedTrxs = await tx.transaction.findMany({
                            where: { description: { contains: invoice.invoiceNo }, companyId: invoice.companyId }
                        });
                        for (const tr of relatedTrxs) {
                            const trJournal = await tx.journal.findFirst({
                                where: { sourceId: tr.id, sourceType: 'Transaction' }
                            });
                            if (trJournal) {
                                await stornoJournalEntry(trJournal.id, `Fatura İptal Edildi REF:${invoice.invoiceNo}`);
                            }
                        }
                    } catch (err) {
                        console.error('[Standalone Accounting Reversal Error]:', err);
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
