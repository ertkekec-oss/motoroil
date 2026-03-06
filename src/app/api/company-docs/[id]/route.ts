import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { deleteFromS3 } from '@/lib/s3';

// Future-ready comment: v2 direct replace (upload bypassing delete steps on client) can be implemented here via dynamic form processing

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        // Belge yönetme yetkisi - download ve upload ile aynı
        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const documentId = params.id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !documentId) {
            return NextResponse.json({ error: 'Geçersiz istek parametreleri' }, { status: 400 });
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
            return NextResponse.json({ error: 'Belge bulunamadı veya erişim yetkiniz yok' }, { status: 404 });
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
        console.error('Company doc delete error:', error);
        return NextResponse.json({ success: false, error: 'Silme işlemi sırasında hata oluştu' }, { status: 500 });
    }
}
