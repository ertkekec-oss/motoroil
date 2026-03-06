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

        if (!hasPermission(session, 'contract_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const rawTenantId = (session as any).tenantId;
        const rawCompanyId = session.companyId;
        const rawContractId = (await params).id;

        const tenantId = sanitizePathInput(rawTenantId);
        const companyId = sanitizePathInput(rawCompanyId);
        const contractId = sanitizePathInput(rawContractId);

        if (!tenantId || !companyId || !contractId) {
            return storageError('Eksik veya geçersiz parametre formatı', 400);
        }

        const contract = await prisma.contract.findFirst({
            where: {
                id: contractId,
                OR: [
                    { buyerCompanyId: companyId },
                    { sellerCompanyId: companyId }
                ]
            }
        });

        if (!contract) {
            return storageError('Sözleşme bulunamadı veya erişim reddedildi', 404);
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return storageError('Geçersiz dosya', 400);
        }

        const file = fileEntry;
        const title = formData.get('title') as string | null;

        const validTypes = [
            'application/pdf'
        ];

        const validationErr = validateStorageFile(file, validTypes, 10);
        if (validationErr) return storageError(validationErr, 400);

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileUuid = randomUUID();

        // Private Path: tenants/{tenantId}/contracts/{contractId}/{uuid}-{fileName}
        const s3Key = `tenants/${tenantId}/contracts/${contractId}/${fileUuid}-${safeOriginalName}`;

        const uploadResult = await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: fileBuffer,
            contentType: file.type,
            metadata: {
                tenantId,
                companyId,
                contractId
            }
        });

        // Add future envelope ID fields as required in prompt comment
        const contractDoc = await prisma.contractDocument.create({
            data: {
                companyId,
                tenantId,
                contractId,
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
                id: contractDoc.id,
                name: contractDoc.name,
                fileName: contractDoc.fileName,
                mimeType: contractDoc.mimeType,
                size: contractDoc.size,
                createdAt: contractDoc.createdAt
            }
        });

    } catch (error: any) {
        console.error('[Storage Error] Contract doc upload:', error);
        return storageError('Yükleme sırasında hata oluştu', 500);
    }
}
