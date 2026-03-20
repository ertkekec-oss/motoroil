
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stornoJournalEntry } from '@/lib/accounting';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Sipariş bulunamadı.' }, { status: 404 });
        }

        const targetBranch = order.branch || 'Merkez';

        // Prevent cancellation if an active PaymentPlan is attached
        const activePlan = await prisma.paymentPlan.findFirst({
            where: {
                description: order.id,
                status: { not: 'İptal' }
            }
        });

        if (activePlan) {
            return NextResponse.json({ 
                success: false, 
                error: 'Bu siparişe bağlı aktif bir vadelendirme planı bulunuyor. Önce işlemi geri almak için İptal butonunu kullanarak vadelendirmeyi iptal etmelisiniz.' 
            }, { status: 400 });
        }

        // Check for forceLocalCancel
        let forceLocalCancel = false;
        try {
            const body = await request.json();
            forceLocalCancel = body.forceLocalCancel || false;
        } catch (e) {
            // empty body
        }

        const invoice = await prisma.salesInvoice.findFirst({
            where: { orderId: order.id, companyId: order.companyId }
        });

        // --- NILVERA E-ARSIV CANCELLATION CHECK ---
        if (invoice && invoice.isFormal && (invoice as any).formalUuid) {
            const invoiceAny = invoice as any;
            const formalType = invoiceAny.formalType || 'EARSIV';

            if (formalType === 'EARSIV' && !forceLocalCancel) {
                let nilveraApiKey = '';
                let nilveraBaseUrl = 'https://apitest.nilvera.com';

                const intSettings = await (prisma as any).integratorSettings.findFirst({
                    where: { companyId: order.companyId, isActive: true }
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
                        where: { companyId_key: { companyId: order.companyId, key: 'eFaturaSettings' } }
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
                            
                        // Send cancellation to Nilvera
                        const cancelResult = await nilvera.cancelEArchiveInvoice(invoiceAny.formalUuid);

                        if (!cancelResult.success) {
                            return NextResponse.json({ 
                                success: false, 
                                askForLocalCancel: true,
                                error: `Bağlı Fatura e-Arşiv (Nilvera) sisteminde iptal edilemedi! Lütfen Nilvera portali üzerinden iptali gerçekleştirin. (Hata: ${cancelResult.error})`
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
                    error: 'Bu siparişe bağlı bir e-Fatura (Ticari/Temel) var. e-Faturalar doğrudan buradan iptal edilemez. Alıcının reddetmesi veya GİB/Kep üzerinden iptal/iade faturası kesilmesi gereklidir.' 
                }, { status: 400 });
            }
        }
        // --- END NILVERA CANCELLATION CHECK ---

        // Reversal logic for POS
        await prisma.$transaction(async (tx) => {
            // 1. Revert Stocks
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            if (Array.isArray(items)) {
                for (const item of items) {
                    if (item.productId) {
                        const qty = Number(item.qty || item.quantity || 1);
                        try {
                            const isB2b = order.marketplace === 'B2B_NETWORK';
                            const isFormalInvoice = invoice && (invoice.isFormal || invoice.status === 'Onaylandı');

                            if (isB2b && !isFormalInvoice) {
                                // Un-invoiced B2B order: it only reserved stock, didn't deduct quantity.
                                await tx.stock.updateMany({
                                    where: { productId: String(item.productId), branch: targetBranch },
                                    data: { reservedStock: { decrement: qty } }
                                });

                                if (targetBranch === 'Merkez') {
                                    await tx.product.updateMany({
                                        where: { id: String(item.productId) },
                                        data: { reservedStock: { decrement: qty } }
                                    });
                                }
                            } else {
                                // Sync Stock Record (increment because we are returning items to shelf)
                                await tx.stock.upsert({
                                    where: { productId_branch: { productId: String(item.productId), branch: targetBranch } },
                                    update: { quantity: { increment: qty } },
                                    create: { productId: String(item.productId), branch: targetBranch, quantity: qty }
                                });

                                // Create Stock Movement
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
                                });

                                // Revert Legacy field if Merkez
                                if (targetBranch === 'Merkez') {
                                    await tx.product.update({
                                        where: { id: String(item.productId) },
                                        data: { stock: { increment: qty } }
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Stock reversal error:", e);
                        }
                    }
                }
            }

            // 2. Revert Kasa & Financial Transaction
            // Find the transaction associated with this order (using REF:id in description)
            const transactions = await tx.transaction.findMany({
                where: {
                    description: { contains: `REF:${id}` }
                }
            });

            for (const t of transactions) {
                let rawData: any = order.rawData || {};
                if (typeof rawData === 'string') {
                    try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                }
                const isAccountSale = t.type === 'Sales' && rawData.paymentMode === 'account';

                // Revert Kasa Balance
                if (!isAccountSale && (t.type === 'Sales' || t.type === 'Collection')) {
                    await tx.kasa.update({
                        where: { id: t.kasaId },
                        data: { balance: { decrement: t.amount } }
                    });
                } else if (!isAccountSale && t.type === 'Expense') {
                    await tx.kasa.update({
                        where: { id: t.kasaId },
                        data: { balance: { increment: t.amount } }
                    });
                }

                // Revert Customer Balance if it was an 'account' sale
                if (t.customerId && t.type === 'Sales') {
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

                // SOFT DELETE Transaction
                await tx.transaction.update({
                    where: { id: t.id },
                    data: { deletedAt: new Date() }
                });
            }

            // 2.5 Revert Points and Coupons
            const customerId = order.customerId || transactions.find((tr) => tr.customerId)?.customerId;
            let rawData: any = order.rawData || {};
            if (typeof rawData === 'string') {
                try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
            }

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

            // 4. Handle Accounting Reversal (Storno)
            try {
                // Main Order Journal
                const mainJournal = await tx.journal.findFirst({
                    where: { sourceId: id, sourceType: 'Order' }
                });
                if (mainJournal) {
                    await stornoJournalEntry(mainJournal.id, 'Satış İptal Edildi (POS)');
                }

                // Related Transaction Journals (e.g., POS Commissions)
                for (const t of transactions) {
                    const tJournal = await tx.journal.findFirst({
                        where: { sourceId: t.id, sourceType: 'Transaction' }
                    });
                    if (tJournal) {
                        await stornoJournalEntry(tJournal.id, `İşlem İptal Edildi (REF:${id})`);
                    }
                }
            } catch (err) {
                console.error('[Accounting Reversal Error]:', err);
            }

            // 3. SOFT DELETE Order
            await tx.order.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: 'İptal Edildi'
                }
            });

            // SOFT DELETE TIED INVOICE
            await tx.salesInvoice.updateMany({
                where: { orderId: id, companyId: order.companyId },
                data: {
                    status: 'İptal Edildi',
                    deletedAt: new Date()
                }
            });

            // AUDIT LOG
            const session = await getSession();
            if (session) {
                await logActivity({
                    tenantId: session.tenantId as string,
                    userId: session.id as string,
                    userName: session.username as string,
                    action: 'CANCEL_ORDER',
                    entity: 'Order',
                    entityId: id,
                    before: order,
                    details: `${order.orderNumber} nolu satış iptal edildi (Soft Delete).`,
                    userAgent: request.headers.get('user-agent') || undefined,
                    ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Order Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
