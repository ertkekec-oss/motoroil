import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { applyPortalRateLimit, buildPortalAuditPayload } from '@/lib/portal-security';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const token = formData.get('token') as string;
        const fileEntry = formData.get('file');

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Token missing or invalid' }, { status: 400 });
        }

        if (!(fileEntry instanceof File)) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const file = fileEntry;

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Anti-DDoS rate-limit hook
        const security = await applyPortalRateLimit(req, tokenHash);
        if (!security.ok) {
            return NextResponse.json({ error: security.error }, { status: security.status });
        }

        const portalToken = await prisma.reconciliationPortalToken.findUnique({
            where: { tokenHash },
            include: { reconciliation: true }
        });

        if (!portalToken || portalToken.revokedAt || portalToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const recon = portalToken.reconciliation;

        if (['SIGNED', 'REJECTED', 'DISPUTED'].includes(recon.status)) {
            return NextResponse.json({ error: `Not allowed in status ${recon.status}` }, { status: 400 });
        }

        // Validation: Allowed Types
        const validMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!validMimeTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF, images, Word, Excel, and CSV are allowed.' }, { status: 400 });
        }

        // Validation: Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        // Clean user's original file name using simple regex whitelist
        const cleanName = (file.name || 'document').replace(/[^a-zA-Z0-9.\-_]/g, '_');

        // Exact Standardized S3 private path string:
        const s3Key = `tenants/${recon.tenantId}/reconciliation/${recon.id}/disputes/${randomUUID()}-${cleanName}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3 'private' bucket maintaining multi-tenant boundary isolation
        await uploadToS3({
            bucket: 'private',
            key: s3Key,
            body: buffer,
            contentType: file.type
        });

        // Log the file upload via portal
        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                ...buildPortalAuditPayload('DISPUTE_ATTACHMENT_UPLOADED', security, { fileName: cleanName, s3Key, size: file.size })
            }
        });

        return NextResponse.json({ success: true, attachmentKey: s3Key });
    } catch (error: any) {
        console.error('[Dispute Upload Error]:', error?.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
