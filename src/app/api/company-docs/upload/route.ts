import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';
import { sanitizePathInput, storageError, validateStorageFile } from '@/lib/storage/security';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const rawTenantId = (session as any).tenantId;
        const rawCompanyId = session.companyId;

        const tenantId = sanitizePathInput(rawTenantId);
        const companyId = sanitizePathInput(rawCompanyId);

        if (!tenantId || !companyId) {
            return storageError('Tenant veya Company bilgisi eksik', 400);
        }

        const formData = await request.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return storageError('Geçersiz dosya formatı', 400);
        }

        const file = fileEntry;
        const title = formData.get('title') as string | null;

        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        const validationErr = validateStorageFile(file, validTypes, 10);
        if (validationErr) return storageError(validationErr, 400);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        // Strict sanitization for file name
        const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileUuid = randomUUID();

        // Private Path Standartlarına Uygunluk Sağlandı:
        const s3Key = `tenants/${tenantId}/company-docs/${fileUuid}-${safeOriginalName}`;

        const uploadResult = await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: fileBuffer,
            contentType: file.type,
            metadata: {
                tenantId: tenantId,
                companyId: companyId
            }
        });

        const companyDoc = await prisma.companyDocument.create({
            data: {
                companyId,
                tenantId,
                name: title?.trim() || safeOriginalName,
                fileKey: uploadResult.key,
                fileName: originalName,
                mimeType: file.type,
                size: file.size
            }
        });

        // Dönüşe fileKey veya metadata payload'ı harici hassas/gereksiz veri eklenmez
        return NextResponse.json({
            success: true,
            document: {
                id: companyDoc.id,
                name: companyDoc.name,
                fileName: companyDoc.fileName,
                mimeType: companyDoc.mimeType,
                size: companyDoc.size,
                createdAt: companyDoc.createdAt
            }
        });

    } catch (error: any) {
        console.error('[Storage Error] Company doc upload:', error);
        return storageError(error?.message || 'Yükleme sırasında hata oluştu', 500);
    }
}
