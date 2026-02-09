import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const params = await props.params;
        const body = await request.json();

        if (!params.id || params.id === 'undefined') {
            return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        const targetBranch = body.branch || session.branch || 'Merkez';

        // Use transaction for consistency
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // 1. Separate stock from other fields
            const { stock, branch: _b, ...productData } = body;

            // 2. Update Product Basic Info
            const product = await tx.product.update({
                where: { id: params.id },
                data: productData
            });

            // 3. Handle Stock Update if provided
            if (stock !== undefined && stock !== null) {
                const newQty = Number(stock);

                // Get current stock (for diff calculation)
                const currentStockRecord = await tx.stock.findUnique({
                    where: { productId_branch: { productId: params.id, branch: targetBranch } }
                });

                // If checking 'Merkez', fallback to product.stock if no Stock record? 
                // Better to rely on Stock table if possible, or treat 0 as default.
                const oldQty = currentStockRecord ? currentStockRecord.quantity : (targetBranch === 'Merkez' ? product.stock : 0);
                const diff = newQty - oldQty;

                // Sync/Upsert Stock Record
                await tx.stock.upsert({
                    where: { productId_branch: { productId: params.id, branch: targetBranch } },
                    update: { quantity: newQty },
                    create: {
                        productId: params.id,
                        branch: targetBranch,
                        quantity: newQty
                    }
                });

                // Sync Legacy Field if Merkez
                if (targetBranch === 'Merkez') {
                    await tx.product.update({
                        where: { id: params.id },
                        data: { stock: newQty }
                    });
                }

                // Log Movement if changed
                if (diff !== 0) {
                    await tx.stockMovement.create({
                        data: {
                            productId: params.id,
                            branch: targetBranch,
                            companyId: product.companyId,
                            quantity: diff,
                            price: product.buyPrice || 0,
                            type: 'ADJUSTMENT',
                            referenceId: `MANUAL_UPDATE_${new Date().getTime()}`
                        }
                    });
                }
            }

            return product;
        });

        // Log activity (Audit)
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
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const params = await props.params;

        if (!params.id || params.id === 'undefined') {
            return NextResponse.json({ success: false, error: 'Product ID is missing' }, { status: 400 });
        }

        const oldProduct = await prisma.product.findUnique({ where: { id: params.id } });

        // SOFT DELETE
        await prisma.product.update({
            where: { id: params.id },
            data: { deletedAt: new Date() }
        });

        // Log activity
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