import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyPortalRateLimit, buildPortalAuditPayload } from '@/lib/portal-security';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, action } = body;

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Token missing or invalid' }, { status: 400 });
        }

        if (!['SIGNED', 'REJECTED'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 1. Ddos + Security Hook
        const security = await applyPortalRateLimit(req, token);
        if (!security.ok) {
            return NextResponse.json({ error: security.error }, { status: security.status });
        }

        // 2. Resolve Token
        const session = await prisma.signatureSession.findUnique({
            where: { tokenHash: token },
            include: {
                envelope: { include: { recipients: true } },
                recipient: true
            }
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const env = session.envelope;

        if (['COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(env.status)) {
            return NextResponse.json({ error: `Not allowed in envelope status ${env.status}` }, { status: 400 });
        }

        if (['SIGNED', 'REJECTED'].includes(session.recipient.status)) {
            return NextResponse.json({ error: `You have already responded` }, { status: 400 });
        }

        // 3. Serial / OrderIndex enforcement check (for future advanced routes)
        const pendingRecipientsWithLowerOrder = env.recipients.filter(r =>
            r.orderIndex < session.recipient.orderIndex && r.status === 'PENDING'
        );
        if (pendingRecipientsWithLowerOrder.length > 0) {
            return NextResponse.json({ error: `You cannot sign yet. Waiting for previous signers.` }, { status: 400 });
        }

        // 4. Update Recipient
        await prisma.signatureRecipient.update({
            where: { id: session.recipientId },
            data: {
                status: action as 'SIGNED' | 'REJECTED',
                signedAt: new Date()
            }
        });

        // 5. Evaluate Envelope state
        const updatedRecipients = await prisma.signatureRecipient.findMany({
            where: { envelopeId: env.id }
        });

        const allSigned = updatedRecipients.every(r => r.status === 'SIGNED');
        const anyRejected = updatedRecipients.some(r => r.status === 'REJECTED');

        let newEnvStatus = env.status;
        if (anyRejected) {
            newEnvStatus = 'REJECTED';
        } else if (allSigned) {
            newEnvStatus = 'COMPLETED';
        } else {
            newEnvStatus = 'IN_PROGRESS';
        }

        if (newEnvStatus !== env.status) {
            await prisma.signatureEnvelope.update({
                where: { id: env.id },
                data: { status: newEnvStatus }
            });
        }

        // 6. Audit Trail
        await prisma.signatureAuditEvent.create({
            data: {
                tenantId: env.tenantId,
                envelopeId: env.id,
                action: action === 'SIGNED' ? 'RECIPIENT_SIGNED' : 'RECIPIENT_REJECTED',
                actorId: session.recipientId,
                ...buildPortalAuditPayload(action, security, { role: session.recipient.role }) as any
            }
        });

        if (newEnvStatus === 'COMPLETED') {
            await prisma.signatureAuditEvent.create({
                data: {
                    tenantId: env.tenantId,
                    envelopeId: env.id,
                    action: 'ENVELOPE_COMPLETED',
                    ...buildPortalAuditPayload('ENVELOPE_COMPLETED', security) as any
                }
            });
        }

        return NextResponse.json({ success: true, newStatus: newEnvStatus });
    } catch (error: any) {
        console.error('[Sign Portal Err]:', error?.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
