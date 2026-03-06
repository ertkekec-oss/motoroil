import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        // Parametre uyumluluğu desteği (Mevcut versiyona göre await veya normal obje kullanımı desteği)
        const documentId = (await params).id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !documentId) {
            return storageError('Eksik veya geçersiz parametreler', 400);
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
            return storageError('Belge bulunamadı veya erişim yetkiniz yok', 404);
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
        console.error('[Storage Error] Download signed URL:', error);
        return storageError('İndirme adresi alınamadı', 500);
    }
}
