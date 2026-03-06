import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const documentId = (await params).id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !documentId) {
            return storageError('Geçersiz istek parametreleri', 400);
        }

        // DB'den belgeyi bul (İzolasyon korumalı filtrelenmiş şekilde)
        const doc = await prisma.companyDocument.findFirst({
            where: {
                id: documentId,
                companyId: companyId,
                tenantId: tenantId
            }
        });

        if (!doc) {
            return storageError('Belge bulunamadı veya erişim yetkiniz yok', 404);
        }

        // Önce S3'ten sil (Private bucket)
        try {
            await deleteFromS3({
                bucket: 'private',
                key: doc.fileKey
            });
        } catch (s3Error: any) {
            console.error('S3 delete document error under tenant scope:', s3Error);
            // S3 tarafında dosya gerçekten yoksa veya çoktan silindiyse bile (orphan record engeli için)
            // DB kaydının silinmesine izin verebiliriz. Ancak best-practice olarak hatayı logluyoruz.
        }

        // Sonra DB kaydını sil
        await prisma.companyDocument.delete({
            where: { id: doc.id }
        });

        // Kesinlikle fileKey veya S3 dizini response içinde gösterilmemelidir.
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Storage Error] Company doc delete:', error);
        return storageError('Silme işlemi sırasında hata oluştu', 500);
    }
}
