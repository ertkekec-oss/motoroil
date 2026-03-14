import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        const bom = await prisma.bom.findUnique({
            where: {
                id,
                tenantId: tenantId ? tenantId : undefined,
                companyId: companyId ? companyId : undefined
            },
            include: {
                product: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!bom) {
            return NextResponse.json({ error: 'Reçete bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, bom });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const companyId = session.companyId;
        const tenantId = (session as any).tenantId;

        // Verify existence
        const existingBom = await prisma.bom.findUnique({
            where: { id }
        });

        if (!existingBom) {
            return NextResponse.json({ error: 'Reçete bulunamadı' }, { status: 404 });
        }

        if (tenantId && existingBom.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
        }

        const body = await request.json();
        const { name, code, description, estimatedCost, items, isActive } = body;

        const result = await prisma.$transaction(async (tx) => {
            // Update main BOM
            const bom = await tx.bom.update({
                where: { id },
                data: {
                    name,
                    code,
                    description,
                    estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
                    isActive: isActive !== undefined ? isActive : undefined,
                }
            });

            // If items are provided, replace them
            if (items && Array.isArray(items)) {
                // Delete existing items
                await tx.bomItem.deleteMany({
                    where: { bomId: id }
                });

                // Insert new items
                if (items.length > 0) {
                    await tx.bomItem.createMany({
                        data: items.map((item: any) => ({
                            bomId: id,
                            productId: item.productId,
                            quantity: parseFloat(item.quantity) || 1,
                            unit: item.unit || 'Adet',
                            wastePercentage: item.wastePercentage ? parseFloat(item.wastePercentage) : 0
                        }))
                    });
                }
            }

            // Return updated with items
            return await tx.bom.findUnique({
                where: { id },
                include: {
                    product: true,
                    items: { include: { product: true } }
                }
            });
        });

        return NextResponse.json({ success: true, bom: result });
    } catch (error: any) {
        console.error('BOM update error:', error);
        let errorMessage = error.message;
        if (error.code === 'P2002') {
            errorMessage = 'Bu Reçete numarası (kodu) zaten sistemde kayıtlı. Lütfen benzersiz bir kod girin.';
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: error.code === 'P2002' ? 400 : 500 });
    }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'inventory_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const tenantId = (session as any).tenantId;

        const existingBom = await prisma.bom.findUnique({
            where: { id },
            include: { manufacturingOrders: true }
        });

        if (!existingBom) {
            return NextResponse.json({ error: 'Reçete bulunamadı' }, { status: 404 });
        }

        if (tenantId && existingBom.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
        }

        if (existingBom.manufacturingOrders.length > 0) {
            return NextResponse.json({ error: 'Bu Reçeteye bağlı üretim emirleri var. Reçeteyi silemezsiniz, bunun yerine pasife alabilirsiniz.' }, { status: 400 });
        }

        await prisma.bom.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Reçete başarıyla silindi' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
