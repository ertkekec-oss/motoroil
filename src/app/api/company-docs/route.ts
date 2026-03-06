import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId) {
            return NextResponse.json({ error: 'Tenant veya Company bilgisi eksik' }, { status: 400 });
        }

        // Seçici getirme (asla fileKey dahil edilmiyor)
        const docs = await prisma.companyDocument.findMany({
            where: {
                tenantId: tenantId,
                companyId: companyId
            },
            select: {
                id: true,
                name: true,
                fileName: true,
                mimeType: true,
                size: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            documents: docs
        });

    } catch (error: any) {
        console.error('Company docs list error:', error);
        return NextResponse.json({ success: false, error: 'Belgeler alınamadı' }, { status: 500 });
    }
}
