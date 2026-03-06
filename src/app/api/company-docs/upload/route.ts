import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

function sanitizePathInput(input: string | undefined | null): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed || trimmed.includes('..')) return null;
    return trimmed;
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'company_manage') && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const rawTenantId = (session as any).tenantId;
        const rawCompanyId = session.companyId;

        const tenantId = sanitizePathInput(rawTenantId);
        const companyId = sanitizePathInput(rawCompanyId);

        if (!tenantId || !companyId) {
            return NextResponse.json({ error: 'Tenant veya Company bilgisi eksik veya geçersiz' }, { status: 400 });
        }

        const formData = await request.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'Geçersiz dosya formatı' }, { status: 400 });
        }

        const file = fileEntry as File;
        const title = formData.get('title') as string | null;

        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'   // xlsx
        ];

        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Desteklenmeyen dosya formatı. (PDF, JPEG, PNG, DOCX, XLSX)' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Dosya boyutu 10MB\'ı aşamaz' }, { status: 400 });
        }

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
        console.error('Company doc upload error:', error);
        return NextResponse.json({ success: false, error: 'Yükleme sırasında hata oluştu' }, { status: 500 });
    }
}
