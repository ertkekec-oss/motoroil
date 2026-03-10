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
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP allowed.' }, { status: 400 });
        }

        // Validation: Size (Max 8MB)
        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 8MB.' }, { status: 400 });
        }

        // Object Key Scheme
        let cleanName = (file.name || '').replace(/[^a-zA-Z0-9.\-_]/g, ''); // Sanitize original file name
        if (!cleanName) cleanName = 'file';

        const s3Key = `tenants/${tenantId}/products/${productId}/${randomUUID()}-${cleanName}`;

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

        // Update the Product in the database with multi-tenant isolation IF it's not a temp product
        if (productId !== 'temp') {
            const { default: prisma } = await import('@/lib/prisma');

            await prisma.product.updateMany({
                where: {
                    id: productId,
                    companyId: tenantId
                },
                data: {
                    imageKey: s3Key,
                    imageUrl: imageUrl
                }
            });
        }

        return NextResponse.json({ ok: true, key: s3Key, imageUrl });
    } catch (error: any) {
        console.error('[Product Image Upload Error]:', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
