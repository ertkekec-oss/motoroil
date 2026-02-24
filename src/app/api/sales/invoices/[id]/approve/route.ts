
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        // ✅ GÜVENLİK: İstek bağlamını ve yetkiyi doğrula
        const ctx = await getRequestContext(request as any);
        if (!ctx.companyId) {
            return NextResponse.json({ success: false, error: 'Firma bağlamı bulunamadı.' }, { status: 401 });
        }

        // ✅ ATOMİKLİK: Tüm işlemleri tek bir transaction içine al
        const result = await prisma.$transaction(async (tx) => {
            // ✅ İZOLASYON: Sadece o şirkete ait faturayı çek
            const invoice = await tx.salesInvoice.findFirst({
                where: { id, companyId: ctx.companyId },
                include: { customer: true }
            });

            if (!invoice) {
                throw new Error('Fatura bulunamadı veya bu işlem için yetkiniz yok.');
            }

            if (invoice.isFormal) {
                throw new Error('Bu fatura zaten onaylanmış.');
            }

            const items = invoice.items as any[];
            const targetBranch = invoice.branch || 'Merkez';

            for (const item of items) {
                if (item.productId) {
                    const qty = Number(item.qty || 1);

                    // ✅ OVERSELL GUARD: Sadece yeterli stok varsa decrement yap (updateMany + count check)
                    const stockUpdate = await tx.stock.updateMany({
                        where: {
                            productId: item.productId,
                            branch: targetBranch,
                            quantity: { gte: qty }
                        },
                        data: { quantity: { decrement: qty } }
                    });

                    if (stockUpdate.count === 0) {
                        throw new Error(`Yetersiz stok veya ürün bulunamadı. Ürün ID: ${item.productId}`);
                    }

                    // ✅ STOK HAREKETİ: Kaydı oluştur
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            branch: targetBranch,
                            companyId: ctx.companyId,
                            quantity: -qty,
                            type: 'SALE',
                            referenceId: invoice.id,
                            price: item.price || 0
                        }
                    });

                    // Legacy sync (Merkez şubesi için denormalize alan)
                    if (targetBranch === 'Merkez') {
                        const productUpdate = await tx.product.updateMany({
                            where: { id: item.productId, companyId: ctx.companyId },
                            data: { stock: { decrement: qty } }
                        });
                        if (productUpdate.count === 0) {
                            throw new Error(`Ürün stok kaydı (legacy) güncellenemedi veya yetkisiz erişim: ${item.productId}`);
                        }
                    }
                }
            }

            // ✅ DURUM GÜNCELLEME: Faturayı resmileştir (updateMany + count check)
            const invoiceUpdate = await tx.salesInvoice.updateMany({
                where: { id, companyId: ctx.companyId },
                data: { status: 'Onaylandı', isFormal: true }
            });
            if (invoiceUpdate.count === 0) {
                throw new Error('Fatura durumu güncellenemedi.');
            }

            // ✅ CARİ GÜNCELLEME: Müşteri borcunu artır (updateMany + count check)
            const customerUpdate = await tx.customer.updateMany({
                where: { id: invoice.customerId, companyId: ctx.companyId },
                data: { balance: { increment: invoice.totalAmount } }
            });
            if (customerUpdate.count === 0) {
                throw new Error('Müşteri bakiyesi güncellenemedi veya yetkisiz erişim.');
            }

            return { success: true, message: 'Fatura resmileştirildi ve stoklar güncellendi.' };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[APPROVE_ERROR]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
