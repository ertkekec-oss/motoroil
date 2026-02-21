import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || (session as any).companyId;

        const transfers = await prisma.stockTransfer.findMany({
            where: { companyId },
            take: 200,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, transfers });
    } catch (err: any) {
        console.error("inventory/transfer GET failed", err);
        return NextResponse.json({ success: false, error: "Transferler yüklenemedi" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || (session as any).companyId;

        const body = await request.json();
        const { productId, productName, productCode, qty, fromBranch, toBranch, requestedBy, notes } = body;

        if (!productId || !qty || !fromBranch || !toBranch) {
            return NextResponse.json({ success: false, error: "Eksik bilgi" }, { status: 400 });
        }

        const quantity = parseInt(qty);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Check source stock
            const sourceStock = await tx.stock.findUnique({
                where: { productId_branch: { productId, branch: fromBranch } }
            });

            if (!sourceStock || sourceStock.quantity < quantity) {
                throw new Error(`Kaynak şubede (${fromBranch}) yeterli stok yok. Mevcut: ${sourceStock?.quantity || 0}`);
            }

            // 2. Create Transfer Record
            const transfer = await tx.stockTransfer.create({
                data: {
                    companyId,
                    productId,
                    productName,
                    productCode,
                    qty: quantity,
                    fromBranch,
                    toBranch,
                    status: 'IN_TRANSIT',
                    requestedBy,
                    notes,
                    shippedAt: new Date()
                }
            });

            // 3. Decrement Source Stock
            await tx.stock.update({
                where: { productId_branch: { productId, branch: fromBranch } },
                data: { quantity: { decrement: quantity } }
            });

            // 4. Update Product Stock (If Product record represents this branch or sum)
            // We follow the logic from purchasing/approve: update both Product and Stock
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (product && product.branch === fromBranch) {
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantity } }
                });
            }

            // 5. Stock Movement
            await tx.stockMovement.create({
                data: {
                    companyId,
                    productId,
                    branch: fromBranch,
                    quantity: -quantity,
                    price: product?.buyPrice || 0,
                    type: 'TRANSFER_OUT',
                    referenceId: transfer.id
                }
            });

            return transfer;
        });

        return NextResponse.json({ success: true, transfer: result });
    } catch (err: any) {
        console.error("inventory/transfer POST failed", err);
        return NextResponse.json({ success: false, error: err.message || "Sevkiyat başlatılamadı" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || (session as any).companyId;

        const { id, action } = await request.json();

        const transfer = await prisma.stockTransfer.findFirst({
            where: { id, companyId }
        });

        if (!transfer) return NextResponse.json({ error: 'Transfer bulunamadı' }, { status: 404 });
        if (transfer.status !== 'IN_TRANSIT') return NextResponse.json({ error: 'Bu transfer zaten işlenmiş' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            if (action === 'RECEIVE') {
                // 1. Update Transfer Status
                await tx.stockTransfer.update({
                    where: { id },
                    data: {
                        status: 'RECEIVED',
                        receivedAt: new Date(),
                        receivedBy: session.user?.name || (session as any).username || 'Sistem'
                    }
                });

                // 2. Increment Target Stock
                await tx.stock.upsert({
                    where: { productId_branch: { productId: transfer.productId, branch: transfer.toBranch } },
                    update: { quantity: { increment: transfer.qty } },
                    create: { productId: transfer.productId, branch: transfer.toBranch, quantity: transfer.qty }
                });

                // 3. Update Product Stock if target is the product's main branch
                const product = await tx.product.findUnique({ where: { id: transfer.productId } });
                if (product && product.branch === transfer.toBranch) {
                    await tx.product.update({
                        where: { id: transfer.productId },
                        data: { stock: { increment: transfer.qty } }
                    });
                }

                // 4. Stock Movement
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: transfer.productId,
                        branch: transfer.toBranch,
                        quantity: transfer.qty,
                        price: product?.buyPrice || 0,
                        type: 'TRANSFER_IN',
                        referenceId: transfer.id
                    }
                });
            }
            else if (action === 'CANCEL') {
                // 1. Update Transfer Status
                await tx.stockTransfer.update({
                    where: { id },
                    data: { status: 'CANCELLED' }
                });

                // 2. Return Stock to Source
                await tx.stock.update({
                    where: { productId_branch: { productId: transfer.productId, branch: transfer.fromBranch } },
                    data: { quantity: { increment: transfer.qty } }
                });

                // 3. Update Product Stock if source was main
                const product = await tx.product.findUnique({ where: { id: transfer.productId } });
                if (product && product.branch === transfer.fromBranch) {
                    await tx.product.update({
                        where: { id: transfer.productId },
                        data: { stock: { increment: transfer.qty } }
                    });
                }

                // 4. Reverse Movement
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: transfer.productId,
                        branch: transfer.fromBranch,
                        quantity: transfer.qty,
                        price: product?.buyPrice || 0,
                        type: 'TRANSFER_CANCEL',
                        referenceId: transfer.id
                    }
                });
            }

            return true;
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("inventory/transfer PUT failed", err);
        return NextResponse.json({ success: false, error: err.message || "İşlem başarısız" }, { status: 500 });
    }
}
