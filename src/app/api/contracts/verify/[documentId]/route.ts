import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
    try {
        const { documentId } = await params;

        // Public verification endpoint. Resolves the document explicitly and securely.
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: {
                envelopes: {
                    include: {
                        signatureArtifacts: true,
                        recipients: true
                    }
                }
            }
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const envelope = document.envelopes[0];
        if (!envelope) return NextResponse.json({ error: "Envelope not found" }, { status: 404 });

        // Map all evidence
        const verificationReport = envelope.signatureArtifacts.map(artifact => {
            const recipient = envelope.recipients.find(r => r.id === artifact.recipientId);
            return {
                recipient: recipient?.name || 'Unknown',
                role: recipient?.role || 'SIGNER',
                signedPdfBlobId: artifact.signedPdfBlobId,
                certChainBlobId: artifact.certChainBlobId,
                ocspCrlBlobId: artifact.ocspCrlBlobId,
                timestampTokenBlobId: artifact.timestampTokenBlobId,
                timestamp: artifact.createdAt.toISOString(),
            };
        });

        return NextResponse.json({
            success: true,
            documentId,
            status: envelope.status,
            createdAt: document.createdAt.toISOString(),
            verificationReport
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
