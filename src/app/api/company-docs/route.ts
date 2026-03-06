import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { storageError } from '@/lib/storage/security';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId) {
            return storageError('Tenant veya Company bilgisi eksik', 400);
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
        console.error('[Storage Error] Company docs list:', error);
        return storageError('Belgeler alınamadı', 500);
    }
}
