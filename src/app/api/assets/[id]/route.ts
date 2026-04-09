import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;
        const asset = await prisma.customerAsset.findUnique({ where: { id } });
        if (!asset || asset.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }

        await prisma.customerAsset.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Asset delete error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;
        const asset = await prisma.customerAsset.findUnique({ where: { id } });
        if (!asset || asset.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }

        const body = await request.json();
        const updatedAsset = await prisma.customerAsset.update({
            where: { id },
            data: {
                primaryIdentifier: body.primaryIdentifier,
                secondaryIdentifier: body.secondaryIdentifier,
                brand: body.brand,
                model: body.model,
                productionYear: body.productionYear ? Number(body.productionYear) : null,
                metadata: body.metadata || asset.metadata
            }
        });

        return NextResponse.json({ success: true, asset: updatedAsset });
    } catch (error: any) {
        console.error('Asset update error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
