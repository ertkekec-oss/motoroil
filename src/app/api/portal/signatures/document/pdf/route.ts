import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { s3Client, getBucketName, sanitizeS3Key } from '@/lib/s3';
import { applyPortalRateLimit } from '@/lib/portal-security';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

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

        // Same fallback logic as before
        let targetBucket: 'private' | 'public' = 'private';

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: getBucketName('private'),
                Key: sanitizeS3Key(env.documentKey)
            }));
        } catch (e: any) {
            targetBucket = 'public';
        }

        // Fetch the object stream from S3
        const command = new GetObjectCommand({
            Bucket: getBucketName(targetBucket),
            Key: sanitizeS3Key(env.documentKey)
        });

        const s3Response = await s3Client.send(command);

        if (!s3Response.Body) {
            return new NextResponse('Document body empty', { status: 500 });
        }

        // Convert the S3 payload into a Web ReadableStream
        const stream = s3Response.Body.transformToWebStream();

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="${env.documentFileName}"`);
        headers.set('Cache-Control', 'private, max-age=3600');

        // Return stream directly!
        return new NextResponse(stream, {
            status: 200,
            headers,
        });

    } catch (error: any) {
        console.error('[Sign Portal PDF Stream Error]:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
