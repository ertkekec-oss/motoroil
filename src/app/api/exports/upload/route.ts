import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';
import { sanitizePathInput, storageError, validateStorageFile } from '@/lib/storage/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'reports_view') && !hasPermission(session, 'reports_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const rawTenantId = (session as any).tenantId;
        const rawCompanyId = session.companyId;

        const tenantId = sanitizePathInput(rawTenantId);
        const companyId = sanitizePathInput(rawCompanyId);

        if (!tenantId || !companyId) {
            return storageError('Eksik veya geçersiz parametre formatı', 400);
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return storageError('Geçersiz dosya', 400);
        }

        const file = fileEntry;
        const title = formData.get('title') as string | null;
        const rawReportType = formData.get('reportType') as string | null;

        const reportType = sanitizePathInput(rawReportType) || "GENERAL";

        const validTypes = [
            'application/pdf',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        const validationErr = validateStorageFile(file, validTypes, 20);
        if (validationErr) return storageError(validationErr, 400);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileUuid = randomUUID();

        // Private Path: tenants/{tenantId}/exports/{reportType}/{uuid}-{fileName}
        const s3Key = `tenants/${tenantId}/exports/${reportType}/${fileUuid}-${safeOriginalName}`;

        const uploadResult = await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: fileBuffer,
            contentType: file.type,
            metadata: {
                tenantId,
                companyId,
                reportType
            }
        });

        // Future context: Ileride background report generation worker, status polling ve retry mekanizmasi eklenebilir. 
        // Su an direk yuklenmis dosyayi READY olarak isaretliyoruz.

        const reportDoc = await prisma.exportReport.create({
            data: {
                companyId,
                tenantId,
                reportType,
                name: title?.trim() || safeOriginalName,
                fileKey: uploadResult.key,
                fileName: originalName,
                mimeType: file.type,
                size: file.size,
                status: 'READY'
            }
        });

        return NextResponse.json({
            success: true,
            report: {
                id: reportDoc.id,
                name: reportDoc.name,
                reportType: reportDoc.reportType,
                fileName: reportDoc.fileName,
                mimeType: reportDoc.mimeType,
                size: reportDoc.size,
                status: reportDoc.status,
                createdAt: reportDoc.createdAt
            }
        });

    } catch (error: any) {
        console.error('[Storage Error] Export report upload:', error);
        return storageError('Yükleme sırasında hata oluştu', 500);
    }
}
