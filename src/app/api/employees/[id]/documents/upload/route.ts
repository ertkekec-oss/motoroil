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

        // Personel dosyalarını yönetmek için geçerli yetki (hr_manage veya staff_manage)
        if (!hasPermission(session, 'hr_manage') && !hasPermission(session, 'staff_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const rawTenantId = (session as any).tenantId;
        const rawCompanyId = session.companyId;
        const rawEmployeeId = (await params).id;

        const tenantId = sanitizePathInput(rawTenantId);
        const companyId = sanitizePathInput(rawCompanyId);
        const employeeId = sanitizePathInput(rawEmployeeId);

        if (!tenantId || !companyId || !employeeId) {
            return storageError('Eksik veya geçersiz parametre formatı', 400);
        }

        // DB'de Employee'yi tenant/company kapsamında denetle
        const employee = await prisma.staff.findFirst({
            where: { id: employeeId, companyId, tenantId }
        });

        if (!employee) {
            return storageError('Personel bulunamadı veya yetkiniz yok', 404);
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
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        const validationErr = validateStorageFile(file, validTypes, 10);
        if (validationErr) return storageError(validationErr, 400);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileUuid = randomUUID();

        // Private Path: tenants/{tenantId}/employees/{employeeId}/{uuid}-{fileName}
        const s3Key = `tenants/${tenantId}/employees/${employeeId}/${fileUuid}-${safeOriginalName}`;

        const uploadResult = await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: fileBuffer,
            contentType: file.type,
            metadata: {
                tenantId,
                companyId,
                employeeId
            }
        });

        const empDoc = await prisma.employeeDocument.create({
            data: {
                companyId,
                tenantId,
                employeeId,
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
                id: empDoc.id,
                name: empDoc.name,
                fileName: empDoc.fileName,
                mimeType: empDoc.mimeType,
                size: empDoc.size,
                createdAt: empDoc.createdAt
            }
        });

    } catch (error: any) {
        console.error('[Storage Error] Employee doc upload:', error);
        return storageError('Yükleme sırasında hata oluştu', 500);
    }
}
