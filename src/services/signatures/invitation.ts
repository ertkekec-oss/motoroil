import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendNetgsmOtp } from "@/lib/otp/netgsm";

// Dummy email service
async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
    console.log(`[EMAIL to ${to}]: Subject: ${subject} | Body: ${body.substring(0, 50)}...`);
    // Ideally use Resend/AWS SES here
    return { success: true };
}

export async function sendSignatureInvitation(envelopeId: string) {
    const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id: envelopeId },
        include: { recipients: true }
    });

    if (!envelope) {
        return { success: false, error: 'Envelope not found' };
    }

    const tenantId = envelope.tenantId;
    let netgsmConfig = null;

    if (envelope.otpRequired) {
        netgsmConfig = await prisma.otpProviderConfig.findUnique({
            where: { tenantId_providerName: { tenantId, providerName: 'NETGSM' } }
        });
    }

    const results = [];

    // Determine Target Recipients based on Sequential Policy
    let targetRecipients = [];

    const sortedRecipients = [...envelope.recipients].sort((a, b) => a.orderIndex - b.orderIndex);

    if (envelope.sequentialSigning) {
        // Find if anyone rejected (blocks the entire line)
        const hasRejected = sortedRecipients.some(r => r.status === 'REJECTED');
        if (hasRejected) {
            return { success: false, error: 'Cannot send invitations, a recipient has already rejected' };
        }

        // Find the FIRST pending recipient
        const nextPending = sortedRecipients.find(r => r.status === 'PENDING');
        if (nextPending) {
            targetRecipients = [nextPending];
        }
    } else {
        // Parallel signing: Target all pending
        targetRecipients = sortedRecipients.filter(r => r.status === 'PENDING');
    }

    if (targetRecipients.length === 0) {
        return { success: true, message: 'No eligible recipients found to invite' };
    }

    for (const recipient of targetRecipients) {
        // 1. Check if session already exists for this pending recipient to avoid spam tokens if repeated
        const existingSession = await prisma.signatureSession.findFirst({
            where: { recipientId: recipient.id, revokedAt: null }
        });

        let tokenHash = '';
        if (existingSession && existingSession.expiresAt > new Date()) {
            tokenHash = existingSession.tokenHash; // Reuse valid session link
        } else {
            // Generate new Token & Session
            const rawToken = randomBytes(32).toString('hex');
            tokenHash = createHash('sha256').update(rawToken).digest('hex');

            // 7 days expiration default
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.signatureSession.create({
                data: {
                    envelopeId: envelope.id,
                    recipientId: recipient.id,
                    tokenHash: tokenHash,
                    expiresAt
                }
            });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const portalLink = `${baseUrl}/portal/signatures/access?token=${tokenHash}`;

        // 2. Send Email
        if (recipient.email) {
            const subject = 'Periodya – İmza Daveti';
            const body = `Şirket: Periodya Test \nBelge: ${envelope.title}\n\nİmzalamak için:\n${portalLink}`;

            await sendEmail({ to: recipient.email, subject, body });

            await prisma.signatureAuditEvent.create({
                data: {
                    tenantId,
                    envelopeId: envelope.id,
                    action: 'INVITATION_SENT_EMAIL',
                    actorId: recipient.id,
                    metaJson: { email: recipient.email }
                }
            });
            results.push({ recipient: recipient.email, type: 'EMAIL', success: true });
        }

        // 3. Send SMS if OTP/Phone available
        if (recipient.phone) {
            const shortLink = portalLink.substring(0, 50) + "...";

            if (netgsmConfig && netgsmConfig.isEnabled) {
                const message = `Periodya imza davetiniz vardir. Baglanti: ${portalLink}`;

                const overrideConfig = {
                    ...netgsmConfig,
                    otpTemplate: message
                };

                const res = await sendNetgsmOtp(overrideConfig, recipient.phone, '');

                if (res.success) {
                    await prisma.signatureAuditEvent.create({
                        data: {
                            tenantId,
                            envelopeId: envelope.id,
                            action: 'INVITATION_SENT_SMS',
                            actorId: recipient.id,
                            metaJson: { phone: recipient.phone }
                        }
                    });
                    results.push({ recipient: recipient.phone, type: 'SMS', success: true });
                } else {
                    results.push({ recipient: recipient.phone, type: 'SMS', success: false, error: res.error });
                }
            }
        }
    }

    // Change status if draft
    if (envelope.status === 'DRAFT') {
        await prisma.signatureEnvelope.update({
            where: { id: envelope.id },
            data: { status: 'PENDING' }
        });
    }

    return { success: true, results };
}
