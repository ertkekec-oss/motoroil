import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/s3';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'accounting_manage') && !hasPermission(session, 'reconciliation_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const documentId = (await params).documentId;
        const tenantId = (session as any).tenantId;

        if (!tenantId || !documentId) {
            return storageError('Eksik veya geçersiz parametreler', 400);
        }

        const doc = await prisma.reconciliationDocument.findFirst({
            where: {
                id: documentId,
                tenantId: tenantId
            }
        });

        if (!doc) {
            return storageError('Belge bulunamadı veya erişim yetkiniz yok', 404);
        }

        // 60 Saniyelik indirme linki (Private S3'ten)
        const signedUrl = await getSignedDownloadUrl({
            bucket: 'private',
            key: doc.fileKey,
            expiresInSeconds: 60,
            downloadFilename: doc.fileName
        });

        return NextResponse.json({
            success: true,
            url: signedUrl
        });

    } catch (error: any) {
        console.error('[Storage Error] Download reconciliation doc signed URL:', error);
        return storageError('İndirme adresi alınamadı', 500);
    }
}
