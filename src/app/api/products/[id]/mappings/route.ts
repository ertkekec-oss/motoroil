import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const productId = (await params).id;

        const mappings = await prisma.marketplaceProductMap.findMany({
            where: {
                companyId: companyId as string,
                productId: productId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ success: true, mappings });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const companyId = session.companyId;
        const productId = (await params).id;

        const body = await request.json();
        const { mappingId } = body;

        if (!mappingId) {
             return NextResponse.json({ error: 'Mapping ID eksik' }, { status: 400 });
        }

        // Verify the mapping belongs to the company + product
        const mapping = await prisma.marketplaceProductMap.findFirst({
            where: {
                id: mappingId,
                companyId: companyId as string,
                productId: productId
            }
        });

        if (!mapping) {
            return NextResponse.json({ error: 'Eşleştirme kaydı bulunamadı veya yetkisiz işlem.' }, { status: 404 });
        }

        await prisma.marketplaceProductMap.delete({
            where: { id: mappingId }
        });

        return NextResponse.json({ success: true, message: 'Eşleştirme kaldırıldı.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
