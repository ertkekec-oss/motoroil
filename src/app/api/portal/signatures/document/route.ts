import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSignedDownloadUrl, s3Client, getBucketName, sanitizeS3Key } from '@/lib/s3';
import { applyPortalRateLimit, buildPortalAuditPayload } from '@/lib/portal-security';
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token missing' }, { status: 400 });
        }

        // Rate limit / Security hook
        const security = await applyPortalRateLimit(req, token);
        if (!security.ok) {
            return NextResponse.json({ error: security.error }, { status: security.status });
        }

        const session = await prisma.signatureSession.findUnique({
            where: { tokenHash: token },
            include: { envelope: true, recipient: true }
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const env = session.envelope;

        // Log document view to audit trail
        await prisma.signatureAuditEvent.create({
            data: {
                tenantId: env.tenantId,
                envelopeId: env.id,
                action: 'SIGN_PORTAL_VIEWED',
                actorId: session.recipientId,
                ...buildPortalAuditPayload('SIGN_PORTAL_VIEWED', security) as any
            }
        });

        // Update session usedAt and recipient status to VIEWED if it's PENDING
        if (!session.usedAt) {
            await prisma.signatureSession.update({
                where: { id: session.id },
                data: { usedAt: new Date() }
            });
        }

        if (session.recipient.status === 'PENDING') {
            await prisma.signatureRecipient.update({
                where: { id: session.recipientId },
                data: { status: 'VIEWED' }
            });
        }

        let targetBucket: 'private' | 'public' = 'private';

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: getBucketName('private'),
                Key: sanitizeS3Key(env.documentKey)
            }));
        } catch (e: any) {
            targetBucket = 'public';
        }

        // 5 minute short-lived token
        const signedUrl = await getSignedDownloadUrl({
            bucket: targetBucket,
            key: env.documentKey,
            expiresInSeconds: 300,
            downloadFilename: env.documentFileName
        });

        return NextResponse.json({
            success: true,
            url: signedUrl,
            fileName: env.documentFileName
        });

    } catch (error: any) {
        console.error('[Sign Portal Document Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
