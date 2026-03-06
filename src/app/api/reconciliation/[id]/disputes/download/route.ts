import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = session.companyId || (session as any).tenantId;

        const { searchParams } = new URL(req.url);
        const disputeId = searchParams.get('disputeId');

        const { id: reconciliationId } = await params;

        if (!disputeId) {
            return NextResponse.json({ error: 'Dispute ID required' }, { status: 400 });
        }

        const dispute = await prisma.reconciliationDispute.findUnique({
            where: { id: disputeId },
            include: { reconciliation: true }
        });

        if (!dispute || !dispute.attachmentKey) {
            return NextResponse.json({ error: 'Dispute or attachment not found' }, { status: 404 });
        }

        // Multi-tenant check
        if (dispute.tenantId !== tenantId || dispute.reconciliationId !== reconciliationId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Generate short-lived signed URL for download (e.g. valid for 5 mins = 300 seconds)
        const url = await getSignedDownloadUrl({ bucket: 'private', key: dispute.attachmentKey, expiresInSeconds: 300 });

        // Audit the internal access
        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId,
                reconciliationId,
                action: 'DISPUTE_ATTACHMENT_DOWNLOADED',
                metaJson: { disputeId, attachmentKey: dispute.attachmentKey, userId: session.id }
            }
        });

        return NextResponse.json({ success: true, url });

    } catch (e: any) {
        console.error('Download Dispute Attachment Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
