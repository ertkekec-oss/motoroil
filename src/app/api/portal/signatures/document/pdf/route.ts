import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { s3Client, getBucketName, sanitizeS3Key } from '@/lib/s3';
import { applyPortalRateLimit } from '@/lib/portal-security';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { redisConnection } from '@/lib/queue/redis';

export const runtime = 'nodejs'; // Required for streaming large files from S3 sometimes, though edge is also fine if small

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Token missing', { status: 400 });
        }

        const security = await applyPortalRateLimit(req, token);
        if (!security.ok) {
            return new NextResponse(security.error, { status: security.status });
        }

        const session = await prisma.signatureSession.findUnique({
            where: { tokenHash: token },
            include: { envelope: true, recipient: true }
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            return new NextResponse('Unauthorized or expired', { status: 401 });
        }

        const env = session.envelope;

        let targetKey = env.documentKey;
        if (env.status === 'COMPLETED' && env.signedDocumentKey) {
            targetKey = env.signedDocumentKey;
        }

        let targetBucket: 'private' | 'public' = 'private';
        let byteArray: Uint8Array | null = null;

        try {
            try {
                await s3Client.send(new HeadObjectCommand({
                    Bucket: getBucketName('private'),
                    Key: sanitizeS3Key(targetKey)
                }));
            } catch (e: any) {
                targetBucket = 'public';
            }

            // Fetch the object stream from S3
            const command = new GetObjectCommand({
                Bucket: getBucketName(targetBucket),
                Key: sanitizeS3Key(targetKey)
            });

            const s3Response = await s3Client.send(command);

            if (s3Response.Body) {
                byteArray = await s3Response.Body.transformToByteArray();
            }
        } catch (s3Err) {
            console.warn(`[Sign Portal] S3 fetch failed for ${targetKey}, trying Redis cache fallback...`);
            const cachedBase64 = await redisConnection.get(`DOC_CACHE:${targetKey}`);
            if (cachedBase64) {
                byteArray = Buffer.from(cachedBase64, 'base64');
            }
        }

        if (!byteArray) {
            return new NextResponse('Document not found or empty', { status: 404 });
        }

        const fileName = (env.status === 'COMPLETED' && env.signedDocumentKey) ? `signed_${env.documentFileName}` : env.documentFileName;

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="${fileName}"`);
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

        // Return byte array directly
        return new NextResponse(byteArray as any, {
            status: 200,
            headers,
        });

    } catch (error: any) {
        console.error('[Sign Portal PDF Stream Error]:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
