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

        const rawTenantId = String(session.tenantId || session.companyId || (session as any).tenantId || '').trim();

        if (!rawTenantId) {
            return NextResponse.json({ error: 'Tenant context missing from session' }, { status: 403 });
        }

        const tenantId = rawTenantId.replace(/[^a-zA-Z0-9._-]/g, '-');
        if (!tenantId) {
            return NextResponse.json({ error: 'Invalid tenantId format' }, { status: 403 });
        }

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const file = fileEntry;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP allowed.' }, { status: 400 });
        }

        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 8MB.' }, { status: 400 });
        }

        let cleanName = (file.name || '').replace(/[^a-zA-Z0-9.\-_]/g, '');
        if (!cleanName) cleanName = 'banner';

        const s3Key = `tenants/${tenantId}/banners/${randomUUID()}-${cleanName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await uploadToS3({
            bucket: 'public',
            key: s3Key,
            body: buffer,
            contentType: file.type,
            cacheControl: "public, max-age=31536000, immutable"
        });

        const imageUrl = getPublicObjectUrl(s3Key);

        return NextResponse.json({ ok: true, key: s3Key, imageUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
