import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await request.json();

        // Resolve Company
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı' }, { status: 404 });
        }

        // Verify Ownership
        const existing = await prisma.branch.findFirst({
            where: { id, companyId: company.id }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Şube bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        const updatedBranch = await prisma.branch.update({
            where: { id },
            data: {
                name: body.name,
                type: body.type,
                city: body.city,
                district: body.district,
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
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // Resolve Company
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId || 'PLATFORM_ADMIN' }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı' }, { status: 404 });
        }

        // Verify Ownership
        const existing = await prisma.branch.findFirst({
            where: { id, companyId: company.id }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Şube bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        await prisma.branch.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
