import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyPortalRateLimit, buildPortalAuditPayload } from '@/lib/portal-security';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, action, otpVerifiedToken } = body;

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

        if (env.otpRequired && action === 'SIGNED') {
            if (!otpVerifiedToken) {
                return NextResponse.json({ error: 'OTP doğrulaması zorunludur' }, { status: 400 });
            }

            // Re-hash and check DB for exact match
            const validVerification = await prisma.otpVerification.findFirst({
                where: {
                    tenantId: env.tenantId,
                    sessionId: session.id,
                    usedAt: { not: null }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!validVerification) {
                return NextResponse.json({ error: 'Geçerli OTP doğrulaması bulunamadı.' }, { status: 400 });
            }

            const { createHash } = await import('crypto');
            const expectedToken = createHash('sha256').update(`${token}-${validVerification.id}-verified-scope-1`).digest('hex');

            if (expectedToken !== otpVerifiedToken) {
                return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş OTP doğrulaması.' }, { status: 400 });
            }
        }

        // 2.5 Viewed-before-sign rule
        if (session.recipient.status === 'PENDING') {
            return NextResponse.json({ error: `You must view the document before responding.` }, { status: 400 });
        }

        // 3. Serial / OrderIndex enforcement check
        // Check if there are any recipients with lower orderIndex who have NOT SIGNED yet.
        // E.g., if a previous signer is PENDING, VIEWED, or REJECTED, block this signer.
        const pendingPreviousSigners = env.recipients.filter(r =>
            r.orderIndex < session.recipient.orderIndex && r.status !== 'SIGNED'
        );
        if (pendingPreviousSigners.length > 0) {
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
                data: {
                    status: newEnvStatus,
                    ...(newEnvStatus === 'COMPLETED' ? { completedAt: new Date() } : {})
                }
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
            // Optional Final Artifact Logic Placeholder
            // Here you would merge audit payload to PDF, but for V1 we copy the file path.
            await prisma.signatureEnvelope.update({
                where: { id: env.id },
                data: { signedDocumentKey: env.documentKey }
            });

            await prisma.signatureAuditEvent.create({
                data: {
                    tenantId: env.tenantId,
                    envelopeId: env.id,
                    action: 'ENVELOPE_COMPLETED',
                    ...buildPortalAuditPayload('ENVELOPE_COMPLETED', security) as any
                }
            });

            await prisma.signatureAuditEvent.create({
                data: {
                    tenantId: env.tenantId,
                    envelopeId: env.id,
                    action: 'ENVELOPE_FINALIZED',
                    metaJson: { finalKey: env.documentKey }
                }
            });
        }

        // 7. Sequential Invitation Trigger
        if (action === 'SIGNED' && newEnvStatus === 'IN_PROGRESS' && env.sequentialSigning) {
            const nextSigner = updatedRecipients.find(r => r.orderIndex > session.recipient.orderIndex && r.status === 'PENDING');
            if (nextSigner) {
                // We would normally fire an event here (e.g. queue a job to send email/sms to nextSigner).
                // For V1 we just log that the next signer should be invited. The worker takes care.

                await prisma.signatureAuditEvent.create({
                    data: {
                        tenantId: env.tenantId,
                        envelopeId: env.id,
                        action: 'NEXT_SIGNER_INVITED',
                        actorId: nextSigner.id,
                        metaJson: { role: nextSigner.role, orderIndex: nextSigner.orderIndex }
                    }
                });

                // TODO: Call actual `sendSignatureInvitation` for nextSigner here or via queue
            }
        }

        return NextResponse.json({ success: true, newStatus: newEnvStatus });
    } catch (error: any) {
        console.error('[Sign Portal Err]:', error?.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
