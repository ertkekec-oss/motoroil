import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userEmail = session.user?.email;
        if (!userEmail) return NextResponse.json({ error: "No email" }, { status: 400 });

        const envelopeId = params.id;

        const recipient = await prisma.signatureRecipient.findFirst({
            where: {
                envelopeId,
                email: userEmail,
                status: { in: ['PENDING', 'VIEWED'] }
            },
            include: { envelope: true }
        });

        if (!recipient) {
            return NextResponse.json({ error: "Not authorized to sign or already signed" }, { status: 403 });
        }

        // Update recipient status
        await prisma.signatureRecipient.update({
            where: { id: recipient.id },
            data: {
                status: 'SIGNED',
                signedAt: new Date(),
                signatureData: "DIGITALLY_SIGNED", // Dummy signature data
                ipAddress: req.headers.get("x-forwarded-for") || '127.0.0.1'
            }
        });

        // Add audit event
        await prisma.signatureAuditEvent.create({
            data: {
                envelopeId,
                tenantId: recipient.envelope.tenantId,
                action: 'ENVELOPE_SIGNED',
                metaJson: { signerEmail: userEmail, role: recipient.role, recipientId: recipient.id }
            }
        });

        // Check if all signed
        const allRecipients = await prisma.signatureRecipient.findMany({
            where: { envelopeId }
        });

        const allSigned = allRecipients.every(r => r.status === 'SIGNED' || r.status === 'REJECTED');
        if (allSigned) {
            // Update envelope if all are done
            const hasRejections = allRecipients.some(r => r.status === 'REJECTED');
            const finalStatus = hasRejections ? 'REJECTED' : 'COMPLETED';

            await prisma.signatureEnvelope.update({
                where: { id: envelopeId },
                data: {
                    status: finalStatus,
                    signedDocumentKey: "mock-final-document-key.pdf" // mock
                }
            });

            await prisma.signatureAuditEvent.create({
                data: {
                    envelopeId,
                    tenantId: recipient.envelope.tenantId,
                    action: `ENVELOPE_${finalStatus}`,
                    metaJson: { completedAt: new Date() }
                }
            });
        } else if (recipient.envelope.status !== 'IN_PROGRESS') {
            await prisma.signatureEnvelope.update({
                where: { id: envelopeId },
                data: { status: 'IN_PROGRESS' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
