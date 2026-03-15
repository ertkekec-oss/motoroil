import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const { id } = params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        const order = await prisma.manufacturingOrder.findUnique({
            where: {
                id,
                tenantId: tenantId ? tenantId : undefined,
                companyId: companyId ? companyId : undefined
            },
            include: {
                product: true,
                bom: true,
                items: { include: { product: true } }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Üretim Emri bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const { id } = params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        const existingOrder = await prisma.manufacturingOrder.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Üretim Emri bulunamadı' }, { status: 404 });
        }

        if (tenantId && existingOrder.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
        }

        const body = await request.json();
        const { status, notes, producedQuantity, actualStartDate, actualEndDate } = body;

        // If transitioning to COMPLETED, we must do Transactional Stock Management
        const order = await prisma.$transaction(async (tx) => {

            // Check if status is updated to "COMPLETED" and wasn't before
            const isCompletingNow = status === 'COMPLETED' && existingOrder.status !== 'COMPLETED';
            
            // Check if status is updated to "IN_PROGRESS" and wasn't before
            const isStartingNow = status === 'IN_PROGRESS' && existingOrder.status !== 'IN_PROGRESS';

            const updatedOrder = await tx.manufacturingOrder.update({
                where: { id },
                data: {
                    status: status || existingOrder.status,
                    notes: notes !== undefined ? notes : existingOrder.notes,
                    producedQuantity: producedQuantity !== undefined ? parseInt(producedQuantity) : existingOrder.producedQuantity,
                    actualStartDate: actualStartDate ? new Date(actualStartDate) : existingOrder.actualStartDate,
                    actualEndDate: actualEndDate ? new Date(actualEndDate) : existingOrder.actualEndDate,
                    totalActualCost: isCompletingNow ? existingOrder.totalEstimatedCost : undefined // Basic assumption: actual = estimated initially
                },
                include: { items: true, product: true, bom: true }
            });

            // 1. If starting (WIP), deduct raw materials (INVENTORY REDUCTION)
            if (isStartingNow) {
                for (const item of updatedOrder.items) {
                    const qtyToDeduct = Math.round(parseFloat(String(item.plannedQuantity)));
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            companyId: updatedOrder.companyId,
                            branch: updatedOrder.branch,
                            quantity: -qtyToDeduct, // Subtract from stock
                            price: parseFloat(String(item.unitCost)),
                            type: 'USAGE',
                            referenceId: `MRP_START_${updatedOrder.orderNumber}`
                        }
                    });

                    // Update explicit stock table
                    await tx.stock.upsert({
                        where: { productId_branch: { productId: item.productId, branch: updatedOrder.branch } },
                        update: { quantity: { decrement: qtyToDeduct } },
                        create: { productId: item.productId, branch: updatedOrder.branch, quantity: -qtyToDeduct }
                    });
                }
            }

            // 2. If completing, add the final product to stock (INVENTORY ADDITION)
            if (isCompletingNow) {
                const finalQty = Math.round(updatedOrder.producedQuantity || updatedOrder.plannedQuantity);
                const finalUnitCost = updatedOrder.totalActualCost ? (parseFloat(String(updatedOrder.totalActualCost)) / finalQty) : 0;

                await tx.stockMovement.create({
                    data: {
                        productId: updatedOrder.productId,
                        companyId: updatedOrder.companyId,
                        branch: updatedOrder.branch,
                        quantity: finalQty, // Positive, adding to stock
                        price: finalUnitCost,
                        type: 'PRODUCTION',
                        referenceId: `MRP_DONE_${updatedOrder.orderNumber}`
                    }
                });

                // Update explicit stock table
                await tx.stock.upsert({
                    where: { productId_branch: { productId: updatedOrder.productId, branch: updatedOrder.branch } },
                    update: { quantity: { increment: finalQty } },
                    create: { productId: updatedOrder.productId, branch: updatedOrder.branch, quantity: finalQty }
                });
            }

            return updatedOrder;
        });

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        console.error('MRP Order update error:', error);
        return NextResponse.json({ success: false, error: 'İşlem Başarısız. Hammadde stoklarında bir hata var.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const { id } = params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const tenantId = (session as any).tenantId;

        const existingOrder = await prisma.manufacturingOrder.findUnique({
            where: { id }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Emir bulunamadı' }, { status: 404 });
        }

        if (tenantId && existingOrder.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
        }

        if (existingOrder.status !== 'DRAFT' && existingOrder.status !== 'CANCELED') {
            return NextResponse.json({ error: 'Sadece Taslak(DRAFT) veya İptal edilmiş(CANCELED) emirleri silebilirsiniz.' }, { status: 400 });
        }

        await prisma.manufacturingOrder.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Üretim Emri silindi' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
