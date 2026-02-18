
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session: any = auth.user;
    const companyId = session.companyId;

    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { name, type, branch } = body;

        // Verify ownership
        const oldKasa = await prisma.kasa.findFirst({
            where: { id, companyId }
        });
        if (!oldKasa) return NextResponse.json({ success: false, error: 'Kasa bulunamadı' }, { status: 404 });

        const updatedKasa = await prisma.kasa.update({
            where: { id },
            data: {
                name,
                ...(type && { type }),
                ...(branch && { branch })
            }
        });

        // Sync with Accounting: Update Account Name (Scoped by companyId via kasaId relation implicit verification)
        try {
            const acc = await prisma.account.findFirst({
                where: { kasaId: id, companyId }
            });
            if (acc) {
                await prisma.account.update({
                    where: { id: acc.id },
                    data: { name: name.toUpperCase() }
                });
            }
        } catch (e) { console.error('Accounting Update Error:', e); }

        // AUDIT LOG
        await logActivity({
            userId: session.id as string,
            userName: session.username as string,
            action: 'UPDATE',
            entity: 'Kasa',
            entityId: id,
            oldData: oldKasa,
            newData: updatedKasa,
            branch: updatedKasa.branch || 'Merkez',
            details: `Kasa güncellendi: ${name}`
        });

        revalidatePath('/accounting');
        return NextResponse.json({ success: true, kasa: updatedKasa });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session: any = auth.user;
    const companyId = session.companyId;

    try {
        const params = await props.params;
        const { id } = params;

        // Verify ownership
        const kasa = await prisma.kasa.findFirst({
            where: { id, companyId }
        });

        if (!kasa) {
            return NextResponse.json({ success: false, error: 'Kasa bulunamadı' }, { status: 404 });
        }

        // Check transactions (already scoped to this Kasa ID)
        const transactionCount = await prisma.transaction.count({
            where: { kasaId: id, companyId }
        });

        if (transactionCount === 0) {
            // HARD DELETE
            try {
                await prisma.account.updateMany({
                    where: { kasaId: id, companyId },
                    data: { kasaId: null, isActive: false }
                });
            } catch (e) { }

            await prisma.kasa.delete({
                where: { id }
            });

            // AUDIT LOG (Hard Delete)
            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'DELETE',
                entity: 'Kasa',
                entityId: id,
                oldData: kasa,
                branch: kasa.branch || 'Merkez',
                details: `Kasa silindi (Kalıcı): ${kasa.name}`
            });

            return NextResponse.json({ success: true, message: 'Hard deleted' });
        } else {
            // SOFT DELETE with RENAME
            const newName = `${kasa.name}_DELETED_${Date.now()}`;

            await prisma.kasa.update({
                where: { id },
                data: {
                    isActive: false,
                    name: newName
                }
            });

            // Deactivate account in accounting
            try {
                await prisma.account.updateMany({
                    where: { kasaId: id, companyId },
                    data: { isActive: false }
                });
            } catch (e) { }

            // AUDIT LOG (Soft Delete)
            await logActivity({
                userId: session.id as string,
                userName: session.username as string,
                action: 'UPDATE',
                entity: 'Kasa',
                entityId: id,
                oldData: kasa,
                newData: { isActive: false, name: newName },
                branch: kasa.branch || 'Merkez',
                details: `Kasa arşivlendi (Soft Delete): ${kasa.name}`
            });

            return NextResponse.json({ success: true, message: 'Soft deleted (Archived)' });
        }

    } catch (error: any) {
        console.error('Delete failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
