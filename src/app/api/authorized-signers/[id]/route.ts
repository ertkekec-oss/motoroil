import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const tenantId = session.tenantId;
        const body = await req.json();
        const id = (await params).id;

        const existing = await prisma.authorizedSigner.findFirst({
            where: { id, tenantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Yetkili bulunamadı' }, { status: 404 });
        }

        if (body.defaultSigner) {
            await prisma.authorizedSigner.updateMany({
                where: { tenantId, defaultSigner: true, id: { not: id } },
                data: { defaultSigner: false }
            });
        }

        const updated = await prisma.authorizedSigner.update({
            where: { id },
            data: {
                name: body.name,
                title: body.title,
                email: body.email,
                phone: body.phone,
                isActive: body.isActive,
                defaultSigner: body.defaultSigner,
                allowedCategories: body.allowedCategories || []
            }
        });

        return NextResponse.json({ success: true, signer: updated });
    } catch (error: any) {
        console.error('Error updating signer:', error);
        return NextResponse.json({ error: error.message || 'Yetkili güncellenemedi.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const tenantId = session.tenantId;
        const id = (await params).id;

        const existing = await prisma.authorizedSigner.findFirst({
            where: { id, tenantId }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Yetkili bulunamadı' }, { status: 404 });
        }

        await prisma.authorizedSigner.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting signer:', error);
        return NextResponse.json({ error: error.message || 'Silme işlemi başarısız.' }, { status: 500 });
    }
}
