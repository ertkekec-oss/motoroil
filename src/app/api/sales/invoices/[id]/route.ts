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

        let refundOption = 'cancel';
        let forceLocalCancel = false;
        try {
            const body = await request.json();
            refundOption = body.refundOption || 'cancel';
            forceLocalCancel = body.forceLocalCancel || false;
        } catch (e) {
            // No body provided, use defaults
        }

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

        // Check Idempotency: Have we already processed a refund for this reference?
        const checkDuplicateReversal = await prisma.transaction.findFirst({
            where: {
                companyId: auth.user.companyId,
                description: { contains: `[İPTAL/İADE] REF:${invoice.orderId || invoice.id}` },
                deletedAt: null
            }
        });

        if (checkDuplicateReversal) {
            return NextResponse.json({ 
                success: false, 
                error: 'Bu faturanın finansal iade/iptal işlemi daha önce yapılmış! Mükerrer işlem engellendi.' 
            }, { status: 400 });
        }

        // --- NILVERA E-ARSIV CANCELLATION CHECK ---
        const invoiceAny = invoice as any;
        if (invoice.isFormal && invoiceAny.formalUuid) {
            const formalType = invoiceAny.formalType || 'EARSIV';

            if (formalType === 'EARSIV' && !forceLocalCancel) {
                let nilveraApiKey = '';
                let nilveraBaseUrl = 'https://apitest.nilvera.com';

                const intSettings = await (prisma as any).integratorSettings.findFirst({
                    where: { companyId: auth.user.companyId, isActive: true }
                });

                if (intSettings?.credentials) {
                    try {
                        const { decrypt } = await import('@/lib/encryption');
                        const creds = JSON.parse(decrypt(intSettings.credentials));
                        nilveraApiKey = (creds.apiKey || creds.ApiKey || '').trim();
                        nilveraBaseUrl = (intSettings.environment === 'PRODUCTION')
                            ? 'https://api.nilvera.com'
                            : 'https://apitest.nilvera.com';
                    } catch (e) {
                        console.warn('[Formal Cancel] Failed to decrypt integratorSettings');
                    }
                }

                if (!nilveraApiKey) {
                    const settings = await prisma.appSettings.findUnique({
                        where: { companyId_key: { companyId: auth.user.companyId, key: 'eFaturaSettings' } }
                    });
                    if (settings && settings.value) {
                        const config = settings.value as any;
                        nilveraApiKey = (config.apiKey || config.nilvera?.apiKey || '').trim();
                        nilveraBaseUrl = (config.environment?.toLowerCase() === 'production' || config.nilvera?.environment?.toLowerCase() === 'production') 
                            ? 'https://api.nilvera.com' 
                            : 'https://apitest.nilvera.com';
                    }
                }

                if (nilveraApiKey) {
                    try {
                        const { NilveraInvoiceService } = await import('@/services/nilveraService');
                        const nilvera = new NilveraInvoiceService({ apiKey: nilveraApiKey, baseUrl: nilveraBaseUrl });
                            
                        // 1. İptal isteği gönder
                        const cancelResult = await nilvera.cancelEArchiveInvoice(invoiceAny.formalUuid);

                        if (!cancelResult.success) {
                            return NextResponse.json({ 
                                success: false, 
                                askForLocalCancel: true,
                                error: `Fatura e-Arşiv (Nilvera) sisteminde iptal edilemediği için GİB'e iletildiğinden sistemimizde de iptali durduruldu. (Hata: ${cancelResult.error})`
                            }, { status: 400 });
                        }
                    } catch(e: any) {
                        return NextResponse.json({ 
                            success: false, 
                            askForLocalCancel: true,
                            error: 'Nilvera e-Arşiv iptal işlemi sırasında beklenmeyen hata oluştu: ' + e.message 
                        }, { status: 400 });
                    }
                } else {
                    return NextResponse.json({ success: false, error: 'e-Belge yapılandırması (Anahtar/Şifre) bulunamadı.' }, { status: 400 });
                }
            } else if (formalType === 'EFATURA' && !forceLocalCancel) {
                return NextResponse.json({ 
                    success: false, 
                    askForLocalCancel: true,
                    error: 'Bu bir e-Fatura (Ticari/Temel). e-Faturalar buradan iptal edilemez. Alıcının reddetmesi veya GİB/KEP portalinden iptal işlemi yapmanız gereklidir.\n\nEğer dışarıdan iptalini sağladıysanız veya iade faturası kestirdiyseniz, sadece yerel işlemleri geri alarak devam edebilirsiniz.' 
                }, { status: 400 });
            }
        }
        // --- END NILVERA CANCELLATION CHECK ---

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
                                if (refundOption === 'balanceToCustomer') {
                                    // 💰 İadeyi Bakiye Olarak Yükle (Cari Alacak / Borçtan Mahsup)
                                    // Periodya'da balance > 0 = Müşteri bize borçlu demektir. (Debt)
                                    // Bakiye/Kredi tanımlamak veya borcunu sıfırlamak için balance'ı küçültmeliyiz (decrement).
                                    if (t.customerId) {
                                        await tx.customer.update({
                                            where: { id: t.customerId },
                                            data: { balance: { decrement: t.amount } }
                                        });

                                        await tx.transaction.create({
                                           data: {
                                               companyId: order.companyId,
                                               kasaId: t.kasaId,
                                               customerId: t.customerId,
                                               amount: t.amount,
                                               type: 'Income',
                                               categoryId: t.categoryId,
                                               description: `[İPTAL/İADE] REF:${order.id} (İade Bedeli Cari Hesaba Alacak Kaydedildi)`,
                                               date: new Date(),
                                           }
                                        });
                                    }
                                } else {
                                    // 💳 Tamamen Para İadesi Yap (Kasa Çıkışı) YA DA Normal İptal (Taslak)
                                    let rawData: any = order.rawData || {};
                                    if (typeof rawData === 'string') {
                                        try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                                    }

                                    if (rawData.paymentMode === 'account') {
                                        // Cari hesaba satılmıştı, kasadan para GİRMEMİŞTİ. İade edilecek nakit yok.
                                        // Sadece müşterinin borcunu sıfırlayacağız (veya faturanın borcunu sileceğiz).
                                        if (t.customerId && t.type === 'Sales') {
                                            await tx.customer.update({
                                                where: { id: t.customerId },
                                                data: { balance: { decrement: t.amount } }
                                            });
                                        }
                                    } else {
                                        // Nakit/Kart/Havale ile girmişti -> Kasadan parayı GİRMİŞTİ. Kasadan geri ÇIKARACAĞIZ.
                                        await tx.kasa.update({
                                            where: { id: t.kasaId },
                                            data: { balance: { decrement: t.amount } }
                                        });
                                    }
                                }
                            } else if (t.type === 'Expense') {
                                // Komisyon vb. giderleri kasaya geri iade et
                                await tx.kasa.update({
                                    where: { id: t.kasaId },
                                    data: { balance: { increment: t.amount } }
                                });
                            }
                            
                            // Orijinal işlemi soft delete yap
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
                    // 1. Revert Customer Balance OR Process Refund Option
                    if (refundOption === 'balanceToCustomer' && invoice.customerId) {
                        // 💰 İadeyi Bakiye Olarak Yükle (Cari Alacak): In a standalone invoice, it had probably added to the balance natively, but we MUST credit the user because they already paid perhaps? Wait! Standard standalone invoices are UNPAID. Wait, if it's standalone, its impact is: customer debt goes UP when invoiced.
                        // So if we CANCEL it, customer debt goes DOWN (decrement).
                        // If they paid for it, that was a separate transaction, which they might want refunded. But this endpoint ONLY cancels the invoice.
                        
                        // IF we treat this as a refund of a paid invoice, we need to handle that carefully, but generally, cancelling a standalone sales invoice just removes the debt.
                        await tx.customer.update({
                            where: { id: invoice.customerId },
                            data: { balance: { decrement: invoice.totalAmount } }
                        });
                        
                        // For 'balanceToCustomer' on a pre-paid standalone, we don't automatically know if they paid. We just revert the debt line. 
                        // To be safe and idempotent, we just revert the debt, since there's no native "Collection" attached to Standalone Invoice within Periodya directly, collections are disjoint.
                    } else if (invoice.customerId) {
                        // 💳 OR Cancel
                        await tx.customer.update({
                            where: { id: invoice.customerId },
                            data: { balance: { decrement: invoice.totalAmount } }
                        });
                    }

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
                    
                    // Create an audit trail transaction showing it was reverted
                    if (invoice.customerId) {
                        const anyKasa = await tx.kasa.findFirst({ where: { companyId: invoice.companyId } });
                        if (anyKasa) {
                             await tx.transaction.create({
                                data: {
                                    companyId: invoice.companyId,
                                    kasaId: anyKasa.id,
                                    customerId: invoice.customerId,
                                    amount: 0, // 0 amount just for the ledger trail, debt was reduced separately
                                    type: 'Income',
                                    description: `[İPTAL/İADE] REF:${invoice.id} Standalone Fatura İptal Edildi`,
                                    date: new Date(),
                                }
                             });
                        }
                    }

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

                    // 4. Accounting Reversal (İade Kaydı)
                    try {
                        const { OtonomYevmiyeMotoru } = await import('@/services/finance/journalEngine');
                        
                        let netAmount = 0;
                        let vatAmount = 0;
                        if (items && Array.isArray(items)) {
                            for (const item of items) {
                                const lineTotal = Number(item.qty) * Number(item.price);
                                const vatRate = Number(item.vat || 20);
                                const lineNet = lineTotal / (1 + vatRate / 100);
                                const lineVat = lineTotal - lineNet;
                                netAmount += lineNet;
                                vatAmount += lineVat;
                            }
                        }

                        await OtonomYevmiyeMotoru.bookSalesReturn({
                            companyId: invoice.companyId,
                            documentId: invoice.id,
                            netAmount,
                            vatAmount,
                            totalAmount: invoice.totalAmount
                        });

                    } catch (err) {
                        console.error('[Standalone Accounting Return Error]:', err);
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
