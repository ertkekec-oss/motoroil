export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToS3, getPublicObjectUrl } from '@/lib/s3';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure tenantId is securely retrieved from the current logged in session
        const rawTenantId = String(session.companyId || (session as any).tenantId || '').trim();

        if (!rawTenantId) {
            return NextResponse.json({ error: 'Tenant context missing from session' }, { status: 403 });
        }

        if (rawTenantId.includes('..')) {
            return NextResponse.json({ error: 'Invalid tenantId' }, { status: 403 });
        }

        const tenantId = rawTenantId.replace(/[^a-zA-Z0-9._-]/g, '-');
        if (!tenantId) {
            return NextResponse.json({ error: 'Invalid tenantId format' }, { status: 403 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');
        let rawProductId = String(formData.get('productId') || '').trim();

        if (!(fileEntry instanceof File) || !rawProductId) {
            return NextResponse.json({ error: 'File and productId are required' }, { status: 400 });
        }

        const file = fileEntry;

        if (rawProductId.includes('..')) {
            return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
        }

        const productId = rawProductId.replace(/[^a-zA-Z0-9._-]/g, '-');
        if (!productId) {
            return NextResponse.json({ error: 'Invalid productId format' }, { status: 400 });
        }

        // Validation: Allowed Types
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Sadece PDF formatı desteklenir.' }, { status: 400 });
        }

        // Validation: Size (Max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Dosya boyutu en fazla 5MB olabilir.' }, { status: 400 });
        }

        // Object Key Scheme
        let cleanName = (file.name || '').replace(/[^a-zA-Z0-9.\-_]/g, ''); // Sanitize original file name
        if (!cleanName) cleanName = 'document.pdf';

        const s3Key = `tenants/${tenantId}/products/${productId}/docs/${randomUUID()}-${cleanName}`;

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
        const documentUrl = getPublicObjectUrl(s3Key);
        const documentName = file.name;

        // Update the Product in the database with multi-tenant isolation IF it's not a temp product
        if (productId !== 'temp') {
            const { default: prisma } = await import('@/lib/prisma');

            await prisma.product.updateMany({
                where: {
                    id: productId,
                    companyId: tenantId
                },
                data: {
                    documentUrl: documentUrl,
                    documentName: documentName
                }
            });
        }

        return NextResponse.json({ ok: true, documentUrl, documentName });
    } catch (error: any) {
        console.error('[Product Document Upload Error]:', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
