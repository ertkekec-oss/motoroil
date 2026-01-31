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

        const oldProduct = await prisma.product.findUnique({ where: { id: params.id } });

        const product = await prisma.product.update({
            where: { id: params.id },
            data: body
        });

        // Log activity
        await logActivity({
            userId: session.id as string,
            userName: session.username as string,
            action: 'UPDATE',
            entity: 'Product',
            entityId: params.id,
            oldData: oldProduct,
            newData: product,
            details: `${product.name} ürünü güncellendi.`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true, product });
    } catch (error: any) {
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
            oldData: oldProduct,
            details: `${oldProduct?.name} ürünü silindi (Soft Delete).`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}