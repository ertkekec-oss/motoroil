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
        const { items, total, kasaId, description, paymentMode, customerName, customerId, earnedPoints, pointsUsed, couponCode, referenceCode, branch, staffId: bodyStaffId } = body;

        // Resolve staffId (either from body or from current session if user is staff)
        let finalStaffId = bodyStaffId;
        if (!finalStaffId && (user as any).id) {
            // Check if current user is stored in Staff table
            const staffRecord = await prisma.staff.findUnique({
                where: { id: (user as any).id },
                select: { id: true }
            });
            if (staffRecord) finalStaffId = staffRecord.id;
        }

        // Get the default company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company && (user as any).tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 404 });
        }

        const companyId = company?.id;

        console.log('Sales Create Request:', { total, kasaId, paymentMode, customerName, referenceCode, companyId, finalStaffId });

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
            // A. Enrich Items with product details for history/receipts
            const enrichedItems = [];
            if (Array.isArray(items) && items.length > 0) {
                const productIds = items.map(i => String(i.productId));
                const products = await tx.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, price: true, salesVat: true }
                });

                const productMap = new Map(products.map(p => [p.id, p]));

                for (const item of items) {
                    const p = productMap.get(String(item.productId));
                    enrichedItems.push({
                        ...item,
                        name: p?.name || 'Ürün',
                        price: item.price || p?.price || 0,
                        vat: p?.salesVat || 20
                    });
                }
            }

            const order = await (tx as any).order.create({
                data: {
                    marketplace: 'POS',
                    marketplaceId: 'LOCAL',
                    orderNumber: orderNumber,
                    companyId: companyId,
                    staffId: finalStaffId,
                    customerName: customerName || 'Perakende Müşteri',
                    totalAmount: finalTotal,
                    currency: 'TRY',
                    status: 'Tamamlandı',
                    orderDate: new Date(),
                    branch: branch || 'Merkez',
                    items: enrichedItems.length > 0 ? enrichedItems : items,
                    rawData: { targetKasaId, description, paymentMode, referenceCode }
                }
            });

            // B. Update Product Stocks (Parallelized)
            if (Array.isArray(items) && items.length > 0) {
                const targetBranch = branch || 'Merkez';
                const stockOps = items.filter(i => i.productId).map(async (item) => {
                    const qty = Number(item.qty || item.quantity || 1);
                    const prodId = String(item.productId);
                    const ops = [];

                    ops.push(tx.stock.upsert({
                        where: { productId_branch: { productId: prodId, branch: targetBranch } },
                        update: { quantity: { decrement: qty } },
                        create: { productId: prodId, branch: targetBranch, quantity: -qty }
                    }));

                    ops.push(tx.stockMovement.create({
                        data: {
                            productId: prodId,
                            branch: targetBranch,
                            companyId: companyId,
                            quantity: -qty,
                            type: 'SALE',
                            referenceId: order.id,
                            price: Number(item.price || 0)
                        }
                    }));

                    if (targetBranch === 'Merkez') {
                        ops.push(tx.product.update({
                            where: { id: prodId },
                            data: { stock: { decrement: qty } }
                        }).catch(e => console.error("Legacy stock sync error:", e)));
                    }

                    return Promise.all(ops);
                });
                await Promise.all(stockOps);
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

            // I. Create Journal
            try {
                await createJournalFromSale(order, enrichedItems, targetKasaId, tx);
            } catch (accErr) {
                console.error('[Accounting Sync Error]:', accErr);
            }

            return order;
        });

        // G. Bank Commission (Post-Transaction)
        // Moved outside main transaction to avoid aborting the sale if commission logic fails
        if (effectivePaymentMode === 'credit_card') {
            // Awaiting commission logic to prevent serverless timeout race conditions
            try {
                console.log(`[Commission] Starting calculation for total: ${finalTotal}, Mode: ${effectivePaymentMode}`);
                const settingsRes = await prisma.appSettings.findUnique({
                    where: {
                        companyId_key: {
                            companyId: companyId,
                            key: 'salesExpenses'
                        }
                    }
                });
                const salesExpenses = settingsRes?.value as any;

                if (Array.isArray(salesExpenses?.posCommissions)) {
                    const instLabelRaw = String(body.installmentLabel || '');
                    let instCount = 1;
                    try {
                        const rawCount = body.installments || body.installmentCount;
                        instCount = parseInt(String(rawCount || '1'), 10);
                        if (isNaN(instCount)) instCount = 1;
                    } catch (e) { instCount = 1; }

                    const instLabelFallback = instCount > 1 ? `${instCount} Taksit` : 'Tek Çekim';

                    console.log(`[Commission] Finding config for: labelRaw="${instLabelRaw}", fallback="${instLabelFallback}", instCount=${instCount}`);

                    const lookups = [
                        instLabelRaw.toLowerCase().trim(),
                        instLabelFallback.toLowerCase().trim(),
                        (instCount === 1 ? 'tek çekim' : ''),
                        (instCount === 1 ? 'nakit' : ''),
                        (instCount === 1 ? 'peşin' : '')
                    ].filter(Boolean);

                    let commissionConfig = salesExpenses.posCommissions.find((c: any) => {
                        if (!c || typeof c !== 'object') return false;
                        const configLabel = String(c.installment || '').toLowerCase().trim();
                        const configNum = parseInt(configLabel.replace(/\D/g, ''), 10);

                        if (lookups.includes(configLabel)) return true;
                        if (instCount > 1 && !isNaN(configNum) && configNum === instCount) return true;
                        if (instCount === 1) {
                            return ['tek', 'tek çekim', 'peşin', 'nakit', '1', '1 taksit'].includes(configLabel);
                        }
                        return false;
                    });

                    if (commissionConfig) {
                        const rate = Number(commissionConfig.rate || 0);
                        if (rate > 0) {
                            const commissionAmount = (finalTotal * rate) / 100;
                            console.log(`[Commission] Found config: ${commissionConfig.installment}, Rate: %${rate}, Amount: ${commissionAmount}`);

                            const commTrx = await prisma.transaction.create({
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

                            await createJournalFromTransaction(commTrx, prisma);

                            await prisma.kasa.update({
                                where: { id: targetKasaId },
                                data: { balance: { decrement: commissionAmount } }
                            });
                            console.log(`[Commission] Successfully recorded commission expense: ${commTrx.id}`);
                        } else {
                            console.log(`[Commission] Config found but rate is 0 or invalid.`);
                        }
                    } else {
                        console.warn(`[Commission] No matching commission config found in settings.`);
                    }
                }
            } catch (commErr) {
                console.error('[Commission] Error calculating or recording commission (Safe Mode):', commErr);
            }
        }

        // AUDIT LOG (Don't await to save response time, catch errors silently)
        logActivity({
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
        }).catch(err => console.error("Sync Audit Error:", err));

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
