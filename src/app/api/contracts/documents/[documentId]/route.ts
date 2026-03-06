import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function DELETE(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'contract_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const documentId = (await params).documentId;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !documentId) {
            return storageError('Geçersiz parametreler', 400);
        }

        const doc = await prisma.contractDocument.findFirst({
            where: {
                id: documentId,
                companyId: companyId,
                tenantId: tenantId
            }
        });

        if (!doc) {
            return storageError('Belge bulunamadı veya yetkiniz yok', 404);
        }

        // S3'ten kalıcı silme
        try {
            await deleteFromS3({
                bucket: 'private',
                key: doc.fileKey
            });
        } catch (s3Error: any) {
            console.warn('S3 file could not be deleted while preparing to delete Contract doc. Maybe it is orphan:', s3Error);
        }

        // Veritabanından silme
        await prisma.contractDocument.delete({
            where: { id: doc.id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Storage Error] Contract doc delete:', error);
        return storageError('Silme işlemi sırasında hata oluştu', 500);
    }
}
