import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = session.companyId || (session as any).tenantId;

        const { id } = await params;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id }
        });

        if (!envelope || envelope.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const requestUrl = new URL(req.url);
        const requestFinal = requestUrl.searchParams.get('final') === 'true';

        let targetKey = envelope.documentKey;
        let targetFileName = envelope.documentFileName;

        if (requestFinal) {
            if (envelope.status !== 'COMPLETED' || !envelope.signedDocumentKey) {
                return NextResponse.json({ error: 'Final document is not ready' }, { status: 400 });
            }
            targetKey = envelope.signedDocumentKey;
            targetFileName = `signed_${envelope.documentFileName}`;
        }

        const signedUrl = await getSignedDownloadUrl({
            bucket: 'private',
            key: targetKey,
            expiresInSeconds: 300,
            downloadFilename: targetFileName
        });

        return NextResponse.json({ success: true, url: signedUrl });
    } catch (e: any) {
        console.error('[Internal Envelope Document Access Error]:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
