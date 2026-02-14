
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const branch = searchParams.get('branch');

        const ctx = await getRequestContext(req);
        const where: any = { companyId: ctx.companyId };
        if (status) where.status = status;
        if (branch) {
            where.OR = [
                { fromBranch: branch },
                { toBranch: branch }
            ];
        }

        if (!(prisma as any).stockTransfer) {
            console.error("CRITICAL: StockTransfer model missing in Prisma Client");
            throw new Error("StockTransfer model missing");
        }

        const transfers = await (prisma as any).stockTransfer.findMany({
            where,
            orderBy: { shippedAt: 'desc' },
            take: 10
        });

        return apiResponse({ transfers }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();
        const { productId, fromBranch, toBranch, qty, requestedBy, notes } = body;

        if (!productId || !fromBranch || !toBranch || !qty || qty <= 0) {
            return NextResponse.json({ success: false, error: 'Geçersiz transfer verisi' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const sourceProduct = await tx.product.findUnique({ where: { id: productId } });
            if (!sourceProduct) throw new Error('Kaynak ürün bulunamadı');
            if (sourceProduct.stock < qty) throw new Error('Yetersiz stok');

            // 1. Düş stoktan (Kaynak)
            await tx.product.update({
                where: { id: productId },
                data: { stock: { decrement: qty } }
            });

            // 2. Transfer Kaydı Oluştur (IN_TRANSIT)
            const transfer = await tx.stockTransfer.create({
                data: {
                    productId,
                    productName: sourceProduct.name,
                    productCode: sourceProduct.code,
                    qty,
                    fromBranch: fromBranch,
                    toBranch: toBranch,
                    requestedBy,
                    notes,
                    status: 'IN_TRANSIT'
                }
            });

            // 3. Bildirim Oluştur
            await (tx as any).notification.create({
                data: {
                    userId: ctx.userId,
                    type: 'INFO',
                    title: 'Stok Transferi Başlatıldı',
                    message: `${fromBranch} -> ${toBranch}: ${qty} adet ${sourceProduct.name} yola çıktı.`
                }
            });

            return { success: true, transfer };
        });

        return apiResponse(result, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();
        const { id, action, receivedBy } = body; // action: 'RECEIVE' or 'CANCEL'

        const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
        if (!transfer || transfer.status !== 'IN_TRANSIT') {
            return NextResponse.json({ success: false, error: 'Geçerli bir transfer bulunamadı' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (action === 'RECEIVE') {
                // 1. Hedef depoda ürünü bul veya oluştur
                const targetProduct = await tx.product.findFirst({
                    where: { code: transfer.productCode, branch: transfer.toBranch }
                });

                if (targetProduct) {
                    await tx.product.update({
                        where: { id: targetProduct.id },
                        data: { stock: { increment: transfer.qty } }
                    });
                } else {
                    const sourceProduct = await tx.product.findUnique({ where: { id: transfer.productId } });
                    if (!sourceProduct) throw new Error('Kaynak ürün bilgisi bulunamadı');

                    const { id: _, stock: __, branch: ___, createdAt: ____, updatedAt: _____, ...productData } = sourceProduct;
                    await tx.product.create({
                        data: {
                            ...productData,
                            stock: transfer.qty,
                            branch: transfer.toBranch
                        }
                    });
                }

                // 2. Durumu güncelle
                const updatedTransfer = await tx.stockTransfer.update({
                    where: { id },
                    data: {
                        status: 'RECEIVED',
                        receivedAt: new Date(),
                        receivedBy
                    }
                });

                // 3. Bildirim Oluştur
                await (tx as any).notification.create({
                    data: {
                        userId: ctx.userId,
                        type: 'SUCCESS',
                        title: 'Transfer Kabul Edildi',
                        message: `${transfer.toBranch} şubesi ${transfer.qty} adet ${transfer.productName} kabul etti.`
                    }
                });

                return updatedTransfer;
            } else if (action === 'CANCEL') {
                // İptal durumunda stoğu geri ana depoya ekle
                await tx.product.update({
                    where: { id: transfer.productId },
                    data: { stock: { increment: transfer.qty } }
                });

                const cancelledTransfer = await tx.stockTransfer.update({
                    where: { id },
                    data: { status: 'CANCELLED' }
                });

                // 3. Bildirim Oluştur
                await (tx as any).notification.create({
                    data: {
                        userId: ctx.userId,
                        type: 'ERROR',
                        title: 'Transfer İptal Edildi',
                        message: `${transfer.fromBranch} -> ${transfer.toBranch} transferi iptal edildi: ${transfer.productName}`
                    }
                });

                return cancelledTransfer;
            }
        });

        return apiResponse({ result }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}
