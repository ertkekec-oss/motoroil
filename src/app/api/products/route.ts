import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { stocks: true }
        });
        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await request.json();
        const { name, code, barcode, brand, category, type, stock, price, buyPrice, supplier, branch,
            salesVat, salesVatIncluded, purchaseVat, purchaseVatIncluded,
            salesOiv, salesOtv, otvType } = body;

        const targetBranch = branch || 'Merkez';
        const initialQty = parseFloat(stock) || 0;
        const bPrice = parseFloat(buyPrice) || 0;

        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    name,
                    code: code || `SKU-${Date.now()}`,
                    barcode: barcode || '',
                    brand: brand || '',
                    category: category || 'Genel',
                    type: type || 'Ürün',
                    stock: initialQty,
                    price: parseFloat(price) || 0,
                    buyPrice: bPrice,
                    supplier: supplier || '',
                    branch: 'Merkez',
                    salesVat: parseInt(salesVat) || 20,
                    salesVatIncluded: salesVatIncluded !== undefined ? salesVatIncluded : true,
                    purchaseVat: parseInt(purchaseVat) || 20,
                    purchaseVatIncluded: purchaseVatIncluded !== undefined ? purchaseVatIncluded : true,
                    salesOiv: parseFloat(salesOiv) || 0,
                    salesOtv: parseFloat(salesOtv) || 0,
                    otvType: otvType || 'Ö.T.V yok',
                    stocks: {
                        create: {
                            branch: targetBranch,
                            quantity: initialQty
                        }
                    }
                },
                include: { stocks: true }
            });

            // Record initial movement for FIFO
            if (initialQty > 0) {
                await (tx as any).stockMovement.create({
                    data: {
                        productId: newProduct.id,
                        branch: targetBranch,
                        quantity: initialQty,
                        price: bPrice,
                        type: 'ADJUSTMENT',
                        details: 'Başlangıç stoğu'
                    }
                });
            }

            // Log activity
            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'CREATE',
                entity: 'Product',
                entityId: newProduct.id,
                newData: newProduct,
                details: `${newProduct.name} ürünü oluşturuldu (Başlangıç stoğu: ${initialQty}).`,
                branch: session.branch as string
            });

            return newProduct;
        });

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
        console.error('Product create error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
