
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();

        const updatedBranch = await prisma.branch.update({
            where: { id },
            data: {
                name: body.name,
                type: body.type,
                city: body.city,
                address: body.address,
                phone: body.phone,
                manager: body.manager,
                status: body.status
            }
        });

        return NextResponse.json({ success: true, branch: updatedBranch });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await prisma.branch.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
