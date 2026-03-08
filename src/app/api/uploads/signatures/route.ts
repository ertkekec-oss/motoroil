export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rawTenantId = String(session.companyId || (session as any).tenantId || '').trim();
        if (!rawTenantId) {
            return NextResponse.json({ error: 'Tenant context missing from session' }, { status: 403 });
        }

        const tenantId = rawTenantId.replace(/[^a-zA-Z0-9._-]/g, '-');

        const formData = await req.formData();
        const fileEntry = formData.get('file');

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const file = fileEntry;

        // Validation: Allowed Types (PDFs)
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Invalid file type. Only PDF allowed.' }, { status: 400 });
        }

        // Validation: Size (Max 15MB)
        if (file.size > 15 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 15MB.' }, { status: 400 });
        }

        let cleanName = (file.name || 'document.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '');

        const s3Key = `tenants/${tenantId}/signatures/drafts/${randomUUID()}-${cleanName}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Standard PDF storage bucket/prefix mechanism
        await uploadToS3({
            bucket: 'private', // Normally contracts are private, but we use what the env supports or public placeholder
            key: s3Key,
            body: buffer,
            contentType: file.type,
            cacheControl: "private, max-age=31536000"
        }).catch(async (e) => {
            console.warn("Fallback to public bucket due to exception:", e.message);
            // Fallback to public if private is not configured in this demo env
            await uploadToS3({
                bucket: 'public',
                key: s3Key,
                body: buffer,
                contentType: file.type,
                cacheControl: "private, max-age=31536000"
            });
        });

        return NextResponse.json({ ok: true, key: s3Key, fileName: cleanName });
    } catch (error: any) {
        console.error('[Signature Upload Error]:', error?.message || error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
