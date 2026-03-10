import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const params = await props.params;
        const body = await request.json();
        const companyId = session.companyId;

        if (!params.id || params.id === 'undefined') {
            return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        const targetBranch = body.branch || session.branch || 'Merkez';

        // 0. Verify ownership
        const existingProduct = await prisma.product.findFirst({
            where: { id: params.id, companyId }
        });
        if (!existingProduct) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });

        // Use transaction for consistency
        const updatedProduct = await prisma.$transaction(async (tx) => {
            const productData = { ...body };
            delete productData.stock;
            delete productData.branch;

            // Görsel değerlerini kazara null/overwrite etmemek için koruma:
            if (productData.imageUrl === undefined || productData.imageUrl === null) {
                delete productData.imageUrl;
            }
            if (productData.imageKey === undefined || productData.imageKey === null) {
                delete productData.imageKey;
            }
            if (productData.salesVat !== undefined) productData.salesVat = parseFloat(productData.salesVat);
            if (productData.purchaseVat !== undefined) productData.purchaseVat = parseFloat(productData.purchaseVat);

            const isParent = productData.isParent;
            const variantsData = productData.variantsData;
            delete productData.isParent;
            delete productData.variantsData;

            // 2. Update Product Basic Info
            const product = await tx.product.update({
                where: { id: params.id },
                data: productData
            });

            // If it converts to parent, zero out the main stock
            if (isParent) {
                await tx.product.update({
                    where: { id: params.id },
                    data: { isParent: true, stock: 0 }
                });
            }

            // 2.5 Generate variants if provided
            if (isParent && variantsData && Array.isArray(variantsData)) {
                for (const v of variantsData) {
                    const childProduct = await tx.product.create({
                        data: {
                            companyId: companyId,
                            name: `${product.name} (${v.variantLabel})`,
                            code: v.code || `${product.code}-${v.variantLabel.replace(/\s+/g, '-').toUpperCase()}`,
                            barcode: v.barcode || '',
                            brand: product.brand || '',
                            category: product.category || 'Genel',
                            type: 'Varyant',
                            stock: parseFloat(v.stock) || 0,
                            price: parseFloat(v.price) || product.price,
                            currency: product.currency || 'TRY',
                            buyPrice: parseFloat(v.buyPrice) || product.buyPrice,
                            purchaseCurrency: product.purchaseCurrency || 'TRY',
                            supplierName: product.supplierName || '',
                            branch: 'Merkez',
                            parentId: product.id,
                            unit: product.unit || 'Adet',
                            salesVat: product.salesVat,
                            purchaseVat: product.purchaseVat,
                            status: product.status,
                            imageUrl: product.imageUrl || undefined,
                            imageKey: product.imageKey || undefined,
                            stocks: {
                                create: {
                                    branch: targetBranch,
                                    quantity: parseFloat(v.stock) || 0
                                }
                            },
                        }
                    });

                    // Initial movement for child
                    if (parseFloat(v.stock) > 0) {
                        await tx.stockMovement.create({
                            data: {
                                productId: childProduct.id,
                                companyId: companyId,
                                branch: targetBranch,
                                quantity: parseFloat(v.stock),
                                price: parseFloat(v.buyPrice) || product.buyPrice || 0,
                                type: 'ADJUSTMENT',
                                referenceId: `MIGRATE_${Date.now()}`
                            }
                        });
                    }
                }
            }

            // 3. Handle Stock Update if provided and not a parent
            if (body.stock !== undefined && body.stock !== null && !isParent) {
                const newQty = Number(body.stock);
                const currentStockRecord = await tx.stock.findUnique({
                    where: { productId_branch: { productId: params.id, branch: targetBranch } }
                });

                const oldQty = currentStockRecord ? currentStockRecord.quantity : (targetBranch === 'Merkez' ? product.stock : 0);
                const diff = newQty - oldQty;

                await tx.stock.upsert({
                    where: { productId_branch: { productId: params.id, branch: targetBranch } },
                    update: { quantity: newQty },
                    create: {
                        productId: params.id,
                        branch: targetBranch,
                        quantity: newQty
                    }
                });

                if (targetBranch === 'Merkez') {
                    await tx.product.update({
                        where: { id: params.id },
                        data: { stock: newQty }
                    });
                }

                if (diff !== 0) {
                    await tx.stockMovement.create({
                        data: {
                            productId: params.id,
                            branch: targetBranch,
                            companyId: companyId,
                            quantity: diff,
                            price: product.buyPrice || 0,
                            type: 'ADJUSTMENT',
                            referenceId: `MANUAL_UPDATE_${Date.now()}`
                        }
                    });
                }
            }

            return product;
        });

        await logActivity({
            userId: session.id as string,
            userName: session.username as string,
            action: 'UPDATE',
            entity: 'Product',
            entityId: params.id,
            after: body,
            details: `${updatedProduct.name} ürünü güncellendi (${targetBranch}).`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true, product: updatedProduct });
    } catch (error: any) {
        console.error('Product Update Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const params = await props.params;
        const companyId = session.companyId;

        if (!params.id || params.id === 'undefined') {
            return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        const oldProduct = await prisma.product.findFirst({
            where: { id: params.id, companyId }
        });
        if (!oldProduct) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });

        await prisma.product.update({
            where: { id: params.id },
            data: { deletedAt: new Date() }
        });

        await logActivity({
            userId: session.id as string,
            userName: session.username as string,
            action: 'DELETE',
            entity: 'Product',
            entityId: params.id,
            before: oldProduct,
            details: `${oldProduct?.name} ürünü silindi (Soft Delete).`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}