import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'reports_view') && !hasPermission(session, 'reports_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId) {
            return storageError('Geçersiz oturum bilgileri', 400);
        }

        const exports = await prisma.exportReport.findMany({
            where: {
                tenantId: tenantId,
                companyId: companyId
            },
            select: {
                id: true,
                reportType: true,
                name: true,
                fileName: true,
                mimeType: true,
                size: true,
                status: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            reports: exports
        });

    } catch (error: any) {
        console.error('[Storage Error] Export list:', error);
        return storageError('Raporlar alınamadı', 500);
    }
}
