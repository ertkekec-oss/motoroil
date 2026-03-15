
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        if (!hasPermission(session, 'inventory_manage')) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const companyId = session.companyId;
        const body = await request.json();
        const { ids, updates, mode, individualUpdates } = body;

        if (mode === 'category') {
            await prisma.product.updateMany({
                where: { id: { in: ids }, companyId },
                data: { category: updates.category }
            });
        } else if (mode === 'vat') {
            await prisma.product.updateMany({
                where: { id: { in: ids }, companyId },
                data: {
                    salesVat: updates.salesVat,
                    purchaseVat: updates.purchaseVat
                }
            });
        } else if (mode === 'barcode' || mode === 'price') {
            await prisma.$transaction(
                Object.keys(individualUpdates).map(id =>
                    prisma.product.updateMany({ // Use updateMany to safely update with companyId
                        where: { id, companyId },
                        data: individualUpdates[id]
                    })
                )
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        if (!hasPermission(session, 'inventory_manage')) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const companyId = session.companyId;
        const body = await request.json();
        const { updates } = body;

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Geçersiz veri formatı' }, { status: 400 });
        }

        await prisma.$transaction(
            updates.map((item: any) => {
                const { id, ...data } = item;
                return prisma.product.updateMany({ // UpdateMany for safety with composite where
                    where: { id: id, companyId },
                    data: data
                });
            })
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Bulk PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        if (!hasPermission(session, 'delete_records')) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });

        const companyId = session.companyId;
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'Silinecek ürün seçilmedi.' }, { status: 400 });
        }

        // Use deleteMany to delete multiple records
        // Note: With foreign keys, this might fail if you don't use OnDelete Cascade or handle related records.
        // Prisma schema should handle cascade usually if defined, but let's see. 
        // Order/Invoice items are usually stored as JSON so weak relation, but Stocks/Movements are strong relations.
        // Let's check schema for cascade.

        // Product schema has:
        // movements StockMovement[] (relation has onDelete: Cascade)
        // stocks Stock[] (relation has onDelete: Cascade)
        // marketplaceMaps MarketplaceProductMap[] (onDelete: Cascade)

        // So simple deleteMany should work for related strong entities.

        // Soft Delete is better practice -> update deletedAt = now()

        await prisma.product.updateMany({
            where: { id: { in: ids }, companyId },
            data: { deletedAt: new Date() }
        });

        // Or Hard Delete?
        // await prisma.product.deleteMany({
        //    where: { id: { in: ids } }
        // });

        // Let's stick to Soft Delete based on other parts of the app using deletedAt.

        return NextResponse.json({ success: true, message: `${ids.length} ürün silindi.` });
    } catch (error: any) {
        console.error('Bulk delete error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
