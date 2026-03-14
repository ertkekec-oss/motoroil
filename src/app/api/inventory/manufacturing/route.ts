import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant bilgisi bulunamadı' }, { status: 400 });
        }

        const whereClause: any = { tenantId };
        if (companyId) {
            whereClause.companyId = companyId;
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

        const orders = await prisma.manufacturingOrder.findMany({
            where: whereClause,
            include: {
                product: {
                    select: { name: true, code: true, unit: true, imageUrl: true }
                },
                bom: {
                    select: { name: true, code: true }
                },
                items: {
                    include: {
                        product: {
                            select: { name: true, code: true, unit: true, price: true, buyPrice: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ success: true, orders });
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

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant bilgisi bulunamadı' }, { status: 400 });
        }

        const body = await request.json();
        const { orderNumber, bomId, plannedQuantity, branch, notes, plannedStartDate, plannedEndDate } = body;

        if (!bomId || !plannedQuantity) {
            return NextResponse.json({ error: 'Reçete ve planlanan miktar zorunludur' }, { status: 400 });
        }

        // 1. Fetch the BOM to know the target product and required items
        const bom = await prisma.bom.findUnique({
            where: { id: bomId },
            include: { items: { include: { product: true } } }
        });

        if (!bom) {
            return NextResponse.json({ error: 'Reçete bulunamadı' }, { status: 404 });
        }

        const qty = parseInt(plannedQuantity) || 1;

        // 2. Wrap in a Prisma Transaction
        const mOrder = await prisma.$transaction(async (tx) => {
            
            let totalEstimatedCost = 0;
            const orderItemsData = bom.items.map(item => {
                const itemPlannedQty = parseFloat(String(item.quantity)) * qty;
                // Add waste calculation: Planned + (Planned * Waste%)
                const wastePercentage = parseFloat(String(item.wastePercentage || 0));
                const totalItemPlannedQty = itemPlannedQty + (itemPlannedQty * (wastePercentage / 100));

                const unitCost = item.product.buyPrice ? parseFloat(String(item.product.buyPrice)) : 0;
                const totalCost = totalItemPlannedQty * unitCost;
                totalEstimatedCost += totalCost;

                return {
                    productId: item.productId,
                    plannedQuantity: totalItemPlannedQty,
                    unitCost: unitCost,
                    totalCost: totalCost
                };
            });

            // Fallback for order number
            const targetOrderNumber = orderNumber || `MRP-${Date.now()}`;

            const order = await tx.manufacturingOrder.create({
                data: {
                    companyId: bom.companyId,
                    tenantId: tenantId,
                    orderNumber: targetOrderNumber,
                    productId: bom.productId,
                    bomId: bom.id,
                    branch: branch || 'Merkez',
                    status: 'PLANNED', // Varsayılan durum: Planlandı
                    plannedQuantity: qty,
                    plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
                    plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
                    totalEstimatedCost: totalEstimatedCost,
                    notes,
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    product: true,
                    bom: true,
                    items: { include: { product: true } }
                }
            });

            return order;
        });

        return NextResponse.json({ success: true, order: mOrder });

    } catch (error: any) {
        console.error('MRP Order creation error:', error);
        let errorMessage = error.message;
        if (error.code === 'P2002') {
            errorMessage = 'Bu Üretim Emri numarası sistemde kayıtlı. Lütfen benzersiz bir numara girin.';
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: error.code === 'P2002' ? 400 : 500 });
    }
}
