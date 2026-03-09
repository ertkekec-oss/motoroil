import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { s3Client, getBucketName, sanitizeS3Key } from '@/lib/s3';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tenantId = session.companyId || (session as any).tenantId;

        const { id } = await params;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id }
        });

        if (!envelope || envelope.tenantId !== tenantId) {
            return new NextResponse('Not found or unauthorized', { status: 404 });
        }

        const url = new URL(req.url);
        const isFinal = url.searchParams.get('final') === 'true';

        let targetKey = envelope.documentKey;
        let targetFileName = envelope.documentFileName;

        if (isFinal) {
            if (envelope.status !== 'COMPLETED' || !envelope.signedDocumentKey) {
                return new NextResponse('Final document is not ready', { status: 400 });
            }
            targetKey = envelope.signedDocumentKey;
            targetFileName = `signed_${envelope.documentFileName}`;
        }

        // Check which bucket it might be in (fallback to public if private fails)
        let targetBucket: 'private' | 'public' = 'private';

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

        if (!s3Response.Body) {
            return new NextResponse('Document body empty', { status: 500 });
        }

        // Convert S3 payload into byte array
        const byteArray = await s3Response.Body.transformToByteArray();

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="${targetFileName}"`);
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

        return new NextResponse(byteArray, {
            status: 200,
            headers,
        });

    } catch (error: any) {
        console.error('[Admin PDF Stream Error]:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
