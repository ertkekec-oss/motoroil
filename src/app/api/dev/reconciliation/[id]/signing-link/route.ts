import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // Only available in non-production unless forced
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_E2E !== 'true') {
        return NextResponse.json({ error: 'DEV_ONLY' }, { status: 403 });
    }

    const { id } = await params;
    const recon = await prisma.reconciliation.findUnique({
        where: { id },
        include: { customer: true }
    });

    if (!recon) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mock an Envelope for signing test if missing
    let envelopeId = recon.linkedEnvelopeId;
    let recipientId = null;

    if (!envelopeId) {
        // Create Document & Version
        const doc = await prisma.document.create({
            data: {
                tenantId: recon.tenantId,
                subject: 'Mock Mutabakat Document',
                type: 'OTHER',
                description: 'E2E Testing Document',
                status: 'PUBLISHED'
            }
        });

        const ver = await prisma.documentVersion.create({
            data: {
                tenantId: recon.tenantId,
                documentId: doc.id,
                version: 1,
                contentHtml: '<p>Mock Content</p>',
                hashSha256: 'mockhash',
                status: 'ACTIVE'
            }
        });

        const env = await prisma.envelope.create({
            data: {
                tenantId: recon.tenantId,
                documentId: doc.id,
                documentVersionId: ver.id,
                status: 'SENT'
            }
        });

        envelopeId = env.id;
        await prisma.reconciliation.update({
            where: { id: recon.id },
            data: { linkedEnvelopeId: envelopeId }
        });

        const recip = await prisma.recipient.create({
            data: {
                tenantId: recon.tenantId,
                envelopeId,
                email: recon.customer.email || 'e2e@example.com',
                name: recon.customer.name,
                role: 'SIGNER',
                status: 'SENT',
                orderIndex: 1,
                authMethod: 'OTP'
            }
        });
        recipientId = recip.id;
    } else {
        const env = await prisma.envelope.findUnique({ where: { id: envelopeId }, include: { recipients: true } });
        recipientId = env?.recipients[0]?.id;
    }

    // Ensure signing session
    let token = crypto.randomUUID().replace(/-/g, '');
    let hash = crypto.createHash('sha256').update(token).digest('hex');

    if (recipientId) {
        await prisma.signingSession.deleteMany({ where: { recipientId } });
        await prisma.signingSession.create({
            data: {
                tenantId: recon.tenantId,
                recipientId,
                publicTokenHash: hash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });

        // Store OTP Mock for test
        await prisma.otpSession.deleteMany({ where: { publicTokenHash: hash } });
        await prisma.otpSession.create({
            data: {
                tenantId: recon.tenantId,
                publicTokenHash: hash,
                codeHash: await require('bcryptjs').hash('123456', 10), // static mock code for testing!
                expiresAt: new Date(Date.now() + 1000 * 60 * 60)
            }
        });

        return NextResponse.json({ url: `/sign/${token}`, token });
    }

    return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
