import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, verifyWriteAccess } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { createJournalFromSale, createJournalFromTransaction } from '@/lib/accounting';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    const writeCheck = verifyWriteAccess(user);
    if (!writeCheck.authorized) return writeCheck.response;

    try {
        const body = await request.json();
        const { items, total, kasaId, description, paymentMode, customerName, customerId, earnedPoints, pointsUsed, couponCode, referenceCode, branch } = body;

        // Get the default company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company && (user as any).tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 404 });
        }

        const companyId = company?.id;

        console.log('Sales Create Request:', { total, kasaId, paymentMode, customerName, referenceCode, companyId });

        // 1. Kasa ID Güvenli Seçim
        let targetKasaId = (kasaId === 'CashKasa' || !kasaId) ? undefined : kasaId;

        // Normalize payment mode
        const effectivePaymentMode = (paymentMode === 'card' || paymentMode === 'credit_card') ? 'credit_card' : paymentMode;

        if (effectivePaymentMode === 'credit_card') {
            if (companyId) {
                const posKasa = await prisma.kasa.findFirst({
                    where: {
                        isActive: true,
                        type: { contains: 'POS' },
                        companyId: companyId
                    }
                });
                if (posKasa) targetKasaId = posKasa.id;
            }

            if (!targetKasaId && companyId) {
                const bankKasa = await prisma.kasa.findFirst({
                    where: {
                        isActive: true,
                        type: 'Banka',
                        companyId: companyId
                    }
                });
                if (bankKasa) targetKasaId = bankKasa.id;
            }
        } else if (effectivePaymentMode === 'transfer') {
            const bankKasa = await prisma.kasa.findFirst({
                where: {
                    isActive: true,
                    type: 'Banka',
                    companyId: company.id // Strict Tenant Isolation
                }
            });
            targetKasaId = bankKasa?.id;
        }

        if (!targetKasaId && companyId) {
            const anyKasa = await prisma.kasa.findFirst({
                where: {
                    isActive: true,
                    companyId: companyId
                }
            });
            targetKasaId = anyKasa?.id;
        }

        if (!targetKasaId) {
            console.error('Kasa Bulunamadı: Hiçbir aktif kasa yok.');
            return NextResponse.json({ success: false, error: 'Sistemde aktif kasa bulunamadı.' }, { status: 400 });
        }

        // 2. Sipariş No
        const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 8);
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderNumber = `POS-${dateStr}-${randomSuffix}`;
        const finalTotal = parseFloat(total);

        const result = await prisma.$transaction(async (tx) => {
            const order = await (tx as any).order.create({
                data: {
                    marketplace: 'POS',
                    marketplaceId: 'LOCAL',
                    orderNumber: orderNumber,
                    companyId: companyId,
                    customerName: customerName || 'Perakende Müşteri',
                    totalAmount: finalTotal,
                    currency: 'TRY',
                    status: 'Tamamlandı',
                    orderDate: new Date(),
                    branch: branch || 'Merkez',
                    items: items as any,
                    rawData: { targetKasaId, description, paymentMode, referenceCode }
                }
            });

            // B. Update Product Stocks
            if (Array.isArray(items)) {
                const targetBranch = branch || 'Merkez';
                for (const item of items) {
                    if (item.productId) {
                        const qty = Number(item.qty || item.quantity || 1);

                        // 1. Update/Upsert Stock Record
                        await tx.stock.upsert({
                            where: { productId_branch: { productId: String(item.productId), branch: targetBranch } },
                            update: { quantity: { decrement: qty } },
                            create: {
                                productId: String(item.productId),
                                branch: targetBranch,
                                quantity: -qty
                            }
                        });

                        // 2. Log Movement
                        await tx.stockMovement.create({
                            data: {
                                productId: String(item.productId),
                                branch: targetBranch,
                                companyId: companyId,
                                quantity: -qty,
                                type: 'SALE',
                                referenceId: order.id,
                                price: Number(item.price || 0)
                            }
                        });

                        // 3. Sync Legacy Field if Merkez
                        if (targetBranch === 'Merkez') {
                            await tx.product.update({
                                where: { id: String(item.productId) },
                                data: { stock: { decrement: qty } }
                            }).catch(e => console.error("Legacy stock sync error:", e));
                        }
                    }
                }
            }

            // C. Update Kasa
            if (effectivePaymentMode !== 'account') {
                await tx.kasa.update({
                    where: { id: targetKasaId },
                    data: { balance: { increment: finalTotal } }
                });
            }

            // D. Create Transaction
            let transactionDesc = description;
            if (!description || description.includes('POS Satışı')) {
                const modeLabel = effectivePaymentMode === 'credit_card' ? 'Kredi Kartı' :
                    effectivePaymentMode === 'account' ? 'Cari Hesap' :
                        effectivePaymentMode === 'transfer' ? 'Havale/EFT' : 'Nakit';
                transactionDesc = `POS Satışı (${modeLabel}) - ${customerName || 'Perakende'}`;
            }

            transactionDesc += ` | REF:${order.id}`;

            await (tx as any).transaction.create({
                data: {
                    companyId: companyId,
                    type: 'Sales',
                    amount: finalTotal,
                    description: transactionDesc,
                    kasaId: targetKasaId,
                    customerId: customerId || null,
                    branch: branch || 'Merkez'
                }
            });

            // E. Update Customer Balance
            if (customerId) {
                const updateData: any = {};
                if (effectivePaymentMode === 'account') {
                    updateData.balance = { increment: finalTotal };
                }
                const netPoints = (earnedPoints || 0) - (pointsUsed || 0);
                if (netPoints !== 0) {
                    updateData.points = { increment: netPoints };
                }
                if (Object.keys(updateData).length > 0) {
                    await tx.customer.update({ where: { id: customerId }, data: updateData });
                }
            }

            // F. Coupon
            if (couponCode) {
                const coupon = await tx.coupon.findUnique({ where: { code: couponCode } }) as any;
                if (coupon) {
                    await tx.coupon.update({
                        where: { code: couponCode },
                        data: { usedCount: (coupon.usedCount || 0) + 1, usedAt: new Date(), isUsed: true }
                    });
                }
            }

            // G. Bank Commission
            if (effectivePaymentMode === 'credit_card') {
                try {
                    const settingsRes = await tx.appSettings.findUnique({ where: { key: 'salesExpenses' } });
                    const salesExpenses = settingsRes?.value as any;

                    if (Array.isArray(salesExpenses?.posCommissions)) {
                        const instLabelRaw = body.installmentLabel;
                        const instCount = body.installments || body.installmentCount || 1;
                        const instLabelFallback = instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim';

                        let commissionConfig = salesExpenses.posCommissions.find((c: any) =>
                            c.installment === instLabelRaw ||
                            c.installment === instLabelFallback ||
                            (instCount === 1 && (c.installment === 'Tek Çekim' || c.installment === 'Nakit/Tek'))
                        );

                        if (commissionConfig && Number(commissionConfig.rate) > 0) {
                            const rate = Number(commissionConfig.rate);
                            const commissionAmount = (finalTotal * rate) / 100;

                            const commTrx = await (tx as any).transaction.create({
                                data: {
                                    companyId: companyId,
                                    type: 'Expense',
                                    amount: commissionAmount,
                                    description: `Banka POS Komisyon Gideri (${commissionConfig.installment})`,
                                    kasaId: targetKasaId,
                                    date: new Date(),
                                    branch: branch || 'Merkez'
                                }
                            });

                            await createJournalFromTransaction(commTrx, tx);

                            await tx.kasa.update({
                                where: { id: targetKasaId },
                                data: { balance: { decrement: commissionAmount } }
                            });
                        }
                    }
                } catch (commErr) {
                    console.error('Commission Error:', commErr);
                }
            }

            // H. Accounting Enrichment
            const enrichedItems = [];
            if (Array.isArray(items)) {
                for (const item of items) {
                    const p = await tx.product.findUnique({ where: { id: String(item.productId) } });
                    enrichedItems.push({
                        ...item,
                        vat: p?.salesVat || 20,
                        price: p?.price || item.price,
                    });
                }
            }

            // I. Create Journal
            try {
                await createJournalFromSale(order, enrichedItems, targetKasaId, tx);
            } catch (accErr) {
                console.error('[Accounting Sync Error]:', accErr);
            }

            return order;
        });

        // AUDIT LOG
        await logActivity({
            tenantId: (user as any).tenantId || 'PLATFORM_ADMIN',
            userId: (user as any).id,
            userName: (user as any).username,
            action: 'CREATE_SALE',
            entity: 'Order',
            entityId: result.id,
            after: result,
            details: `${result.orderNumber} nolu satış gerçekleştirildi.`,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
        });

        return NextResponse.json({
            success: true,
            orderId: result.id,
            orderNumber: result.orderNumber,
            message: 'Satış başarıyla kaydedildi.'
        });

    } catch (error: any) {
        console.error('Sale Create Error Full:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Satış kaydedilemedi.' },
            { status: 500 }
        );
    }
}
