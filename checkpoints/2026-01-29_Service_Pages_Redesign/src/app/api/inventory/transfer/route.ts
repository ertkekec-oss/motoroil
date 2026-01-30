
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, from, to, qty } = body;

        if (!productId || !from || !to || !qty || qty <= 0) {
            return NextResponse.json({ success: false, error: 'Geçersiz transfer verisi' }, { status: 400 });
        }

        if (from === to) {
            return NextResponse.json({ success: false, error: 'Kaynak ve hedef depo aynı olamaz' }, { status: 400 });
        }

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Source Product
            // We need to fetch the fresh data to ensure stock
            const sourceProduct = await tx.product.findUnique({
                where: { id: productId }
            });

            if (!sourceProduct) {
                throw new Error('Kaynak ürün bulunamadı');
            }

            if (sourceProduct.stock < qty) {
                throw new Error(`Yetersiz stok. Mevcut: ${sourceProduct.stock}, Talep: ${qty}`);
            }

            // 2. Decrement Source Stock
            await tx.product.update({
                where: { id: productId },
                data: { stock: { decrement: qty } }
            });

            // 3. Handle Target Product
            // Try to find the same product (same CODE) in the target branch
            const targetProduct = await tx.product.findFirst({
                where: {
                    code: sourceProduct.code,
                    branch: to
                }
            });

            if (targetProduct) {
                // Determine new price (weighted average could be better, but for now we keep target price or update?)
                // Strategy: Just increase stock
                await tx.product.update({
                    where: { id: targetProduct.id },
                    data: { stock: { increment: qty } }
                });
            } else {
                // Create new product record for this branch
                // We copy most fields from source
                const { id, stock, branch, createdAt, updatedAt, ...productData } = sourceProduct;

                await tx.product.create({
                    data: {
                        ...productData,
                        stock: qty,
                        branch: to,
                        // barcode might conflict if unique? We removed @unique globally, added composite.
                        // So same barcode in diff branch is allowed.
                    }
                });
            }

            // 4. Log the transfer (Optional: Create a Transaction or specialized log)
            // For now, assume success is enough

            return { success: true };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Transfer error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Transfer işlemi başarısız' }, { status: 500 });
    }
}
