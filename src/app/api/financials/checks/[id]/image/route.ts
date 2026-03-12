export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToS3, getPublicObjectUrl } from '@/lib/s3';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = String(session.companyId || (session as any).tenantId || '').trim();

        if (!companyId) {
            return NextResponse.json({ error: 'Tenant context missing from session' }, { status: 403 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const file = fileEntry;
        const checkId = params.id;

        const check = await prisma.check.findFirst({
            where: {
                id: checkId,
                companyId: companyId
            }
        });

        if (!check) {
            return NextResponse.json({ error: 'Check not found or unauthorized' }, { status: 404 });
        }

        // Validation: Allowed Types
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, PDF allowed.' }, { status: 400 });
        }

        // Validation: Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        // Object Key Scheme
        let cleanName = (file.name || '').replace(/[^a-zA-Z0-9.\-_]/g, '');
        if (!cleanName) cleanName = 'check-image';

        const s3Key = `tenants/${companyId}/checks/${checkId}/${randomUUID()}-${cleanName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3 'public' bucket
        await uploadToS3({
            bucket: 'public',
            key: s3Key,
            body: buffer,
            contentType: file.type,
            cacheControl: "public, max-age=31536000, immutable"
        });

        // Compute Public URL endpoint
        const imageUrl = getPublicObjectUrl(s3Key);

        await prisma.check.update({
            where: {
                id: checkId,
            },
            data: {
                imageKey: s3Key,
                imageUrl: imageUrl
            }
        });

        return NextResponse.json({ ok: true, key: s3Key, imageUrl });
    } catch (error: any) {
        console.error('[Check Image Upload Error]:', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
