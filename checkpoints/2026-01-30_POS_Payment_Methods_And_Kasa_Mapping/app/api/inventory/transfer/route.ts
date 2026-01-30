
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const branch = searchParams.get('branch');

        const where: any = {};
        if (status) where.status = status;
        if (branch) {
            where.OR = [
                { fromBranch: branch },
                { toBranch: branch }
            ];
        }

        const transfers = await prisma.stockTransfer.findMany({
            where,
            orderBy: { shippedAt: 'desc' },
            take: 100
        });

        return NextResponse.json({ success: true, transfers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
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
            await tx.notification.create({
                data: {
                    type: 'stock',
                    icon: '🚚',
                    text: `${fromBranch} -> ${toBranch}: ${qty} adet ${sourceProduct.name} yola çıktı.`
                }
            });

            return { success: true, transfer };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
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
                await tx.notification.create({
                    data: {
                        type: 'success',
                        icon: '✅',
                        text: `${transfer.toBranch} şubesi ${transfer.qty} adet ${transfer.productName} kabul etti.`
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
                await tx.notification.create({
                    data: {
                        type: 'danger',
                        icon: '❌',
                        text: `${transfer.fromBranch} -> ${transfer.toBranch} transferi iptal edildi: ${transfer.productName}`
                    }
                });

                return cancelledTransfer;
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
