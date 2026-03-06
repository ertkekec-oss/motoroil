import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        // Parametre uyumluluğu desteği (Mevcut versiyona göre await veya normal obje kullanımı desteği)
        const documentId = params.id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !documentId) {
            return NextResponse.json({ error: 'Eksik veya geçersiz parametreler' }, { status: 400 });
        }

        // DB'den evrağı güvenli bir tenant kapsamıyla (isolation) filtrele:
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

        // 60 Saniyelik Signed Download URL
        const signedUrl = await getSignedDownloadUrl({
            bucket: 'private',
            key: doc.fileKey,
            expiresInSeconds: 60,
            downloadFilename: doc.fileName
        });

        // getSignedDownloadUrl returns a string directly
        return NextResponse.json({
            success: true,
            url: signedUrl
        });

    } catch (error: any) {
        console.error('Download signed URL error:', error);
        return NextResponse.json({ success: false, error: 'İndirme adresi alınamadı' }, { status: 500 });
    }
}
