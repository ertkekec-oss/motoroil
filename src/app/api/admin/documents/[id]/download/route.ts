import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { s3Client, getBucketName, sanitizeS3Key } from '@/lib/s3';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        const doc = await prisma.platformDocument.findUnique({
            where: { id }
        });

        if (!doc || !doc.fileKey) {
            return new NextResponse('Not found or no file attached', { status: 404 });
        }

        let targetBucket: 'private' | 'public' = 'public';

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: getBucketName('public'),
                Key: sanitizeS3Key(doc.fileKey)
            }));
        } catch (e: any) {
            targetBucket = 'private'; // fallback
        }

        const command = new GetObjectCommand({
            Bucket: getBucketName(targetBucket),
            Key: sanitizeS3Key(doc.fileKey)
        });

        const s3Response = await s3Client.send(command);

        if (!s3Response.Body) {
            return new NextResponse('Document body empty', { status: 500 });
        }

        const byteArray = await s3Response.Body.transformToByteArray();

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        // Get the original filename from the key or use a default
        const fileName = doc.fileKey.split('/').pop() || `${doc.documentNo}.pdf`;
        headers.set('Content-Disposition', `inline; filename="${fileName}"`);
        headers.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(byteArray, {
            status: 200,
            headers,
        });

    } catch (error: any) {
        console.error('[Admin Doc Download Error]:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
