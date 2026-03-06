import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
            return storageError('Geçersiz parametreler', 400);
        }

        const doc = await prisma.exportReport.findFirst({
            where: {
                id: reportId,
                companyId: companyId,
                tenantId: tenantId
            }
        });

        if (!doc) {
            return storageError('Belge bulunamadı veya yetkiniz yok', 404);
        }

        // S3'ten kalıcı silme
        if (doc.fileKey) {
            try {
                await deleteFromS3({
                    bucket: 'private',
                    key: doc.fileKey
                });
            } catch (s3Error: any) {
                console.warn('S3 file could not be deleted while preparing to delete Export Report. Maybe it is orphan:', s3Error);
            }
        }

        // Veritabanından silme
        await prisma.exportReport.delete({
            where: { id: doc.id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Storage Error] Export report delete:', error);
        return storageError('Silme işlemi sırasında hata oluştu', 500);
    }
}
