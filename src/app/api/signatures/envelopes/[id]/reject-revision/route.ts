import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        const tenantId = session.companyId || (session as any).tenantId;
        const { id } = await params;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id },
            include: { recipients: true }
        });

        if (!envelope || envelope.tenantId !== tenantId) {
            return new NextResponse('Not found or unauthorized', { status: 404 });
        }

        if (envelope.status !== 'REVISION_REQUESTED') {
            return new NextResponse('Envelope is not in revision requested state', { status: 400 });
        }

        // Find all recipients that requested revision and convert them back to PENDING (or REVISION_REJECTED if you want to keep track, but PENDING allows them to sign again)
        // Wait, the UI uses the status to allow signing. `PENDING` or `VIEWED` can sign.
        // Let's set them to 'VIEWED' so they can sign again, but we will add an audit event so they know it was rejected.
        await prisma.signatureRecipient.updateMany({
            where: {
                envelopeId: id,
                status: 'REVISION_REQUESTED'
            },
            data: {
                status: 'PENDING'
            }
        });

        // Update envelope status back to IN_PROGRESS
        await prisma.signatureEnvelope.update({
            where: { id },
            data: {
                status: 'IN_PROGRESS'
            }
        });

        // Add audit trail from Sender
        await prisma.signatureAuditEvent.create({
            data: {
                tenantId: envelope.tenantId,
                envelopeId: id,
                action: 'ENVELOPE_REVISION_REJECTED',
                metaJson: {
                    rejectedByAdminId: session.user.id,
                    message: "Revize talebini gönderen makam reddetti. Lütfen belgeyi mevcut haliyle imzalayınız."
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Reject Revision Error]:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
