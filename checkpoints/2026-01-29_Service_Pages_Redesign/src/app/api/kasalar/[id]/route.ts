
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const body = await request.json();
        const { name } = body;

        const updatedKasa = await prisma.kasa.update({
            where: { id },
            data: { name }
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
    try {
        const params = await props.params;
        const { id } = params;

        // 1. Get the Kasa to know its name
        const kasa = await prisma.kasa.findUnique({
            where: { id }
        });

        if (!kasa) {
            return NextResponse.json({ success: false, error: 'Kasa bulunamadı' }, { status: 404 });
        }

        // 2. Check transactions
        const transactionCount = await prisma.transaction.count({
            where: { kasaId: id }
        });

        if (transactionCount === 0) {
            // HARD DELETE
            await prisma.kasa.delete({
                where: { id }
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
            return NextResponse.json({ success: true, message: 'Soft deleted (Archived)' });
        }

    } catch (error: any) {
        console.error('Delete failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
