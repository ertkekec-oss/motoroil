import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';
import { sanitizePathInput, storageError, validateStorageFile } from '@/lib/storage/security';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'accounting_manage') && !hasPermission(session, 'reconciliation_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const rawTenantId = (session as any).tenantId;
        const rawReconciliationId = (await params).id;

        const tenantId = sanitizePathInput(rawTenantId);
        const reconciliationId = sanitizePathInput(rawReconciliationId);

        if (!tenantId || !reconciliationId) {
            return storageError('Eksik veya geçersiz parametre formatı', 400);
        }

        // Verify reconciliation belongs to this tenant
        const recon = await prisma.reconciliation.findFirst({
            where: {
                id: reconciliationId,
                tenantId: tenantId
            }
        });

        if (!recon) {
            return storageError('Mutabakat bulunamadı veya erişim reddedildi', 404);
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return storageError('Geçersiz dosya', 400);
        }

        const file = fileEntry;
        const title = formData.get('title') as string | null;

        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        const validationErr = validateStorageFile(file, validTypes, 10);
        if (validationErr) return storageError(validationErr, 400);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileUuid = randomUUID();

        // Private Path: tenants/{tenantId}/reconciliation/{reconciliationId}/{uuid}-{fileName}
        const s3Key = `tenants/${tenantId}/reconciliation/${reconciliationId}/${fileUuid}-${safeOriginalName}`;

        const uploadResult = await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: fileBuffer,
            contentType: file.type,
            metadata: {
                tenantId,
                reconciliationId
            }
        });

        const reconDoc = await prisma.reconciliationDocument.create({
            data: {
                tenantId,
                reconciliationId,
                name: title?.trim() || safeOriginalName,
                fileKey: uploadResult.key,
                fileName: originalName,
                mimeType: file.type,
                size: file.size
            }
        });

        return NextResponse.json({
            success: true,
            document: {
                id: reconDoc.id,
                name: reconDoc.name,
                fileName: reconDoc.fileName,
                mimeType: reconDoc.mimeType,
                size: reconDoc.size,
                createdAt: reconDoc.createdAt
            }
        });

    } catch (error: any) {
        console.error('[Storage Error] Reconciliation doc upload:', error);
        return storageError('Yükleme sırasında hata oluştu', 500);
    }
}
