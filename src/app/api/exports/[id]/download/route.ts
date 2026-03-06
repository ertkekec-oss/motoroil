import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'reports_view') && !hasPermission(session, 'reports_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const reportId = (await params).id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !reportId) {
            return storageError('Eksik veya geçersiz parametreler', 400);
        }

        const report = await prisma.exportReport.findFirst({
            where: {
                id: reportId,
                tenantId: tenantId,
                companyId: companyId
            }
        });

        if (!report) {
            return storageError('Rapor bulunamadı veya erişim yetkiniz yok', 404);
        }

        if (report.status !== 'READY' || !report.fileKey) {
            return storageError('Rapor henüz hazır değil', 400);
        }

        // 60 sn valid signed URL
        const signedUrl = await getSignedDownloadUrl({
            bucket: 'private',
            key: report.fileKey,
            expiresInSeconds: 60,
            downloadFilename: report.fileName || report.name
        });

        return NextResponse.json({
            success: true,
            url: signedUrl
        });

    } catch (error: any) {
        console.error('[Storage Error] Download export report signed URL:', error);
        return storageError('İndirme adresi alınamadı', 500);
    }
}
