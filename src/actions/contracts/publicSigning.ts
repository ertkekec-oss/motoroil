"use server";

import { prisma } from '@/lib/prisma';
import { verifyTokenHash } from '@/services/contracts/tokens';
import { appendAuditEvent } from '@/services/contracts/audit';
import { canTransitionEnvelope, canTransitionRecipient, enforceOrderIndex } from '@/services/contracts/stateMachine';
import { ContractActorType, ContractAuditAction } from '@prisma/client';
import { getProvider } from '@/services/contracts/providers';

export async function fetchSession(publicTokenHash: string) {
    const session = await prisma.signingSession.findUnique({
        where: { publicTokenHash },
        include: {
            recipient: {
                include: {
                    envelope: {
                        include: {
                            document: true,
                            documentVersion: true,
                            recipients: { orderBy: { orderIndex: 'asc' } }
                        }
                    }
                }
            }
        }
    });

    if (!session) return null;
    if (new Date() > session.expiresAt) return { expired: true, session };

    if (session.tokenUsedAt) return { expired: true, session };

    return session;
}

export async function logSessionViewed(publicTokenHash: string, ip: string, userAgent: string) {
    const session = await prisma.signingSession.findUnique({ where: { publicTokenHash }, include: { recipient: true } });
    if (!session || session.tokenUsedAt || new Date() > session.expiresAt) return;

    await prisma.$transaction(async (tx) => {
        // Only log once (if status is CREATED or SENT)
        if (session.recipient.status === 'CREATED' || session.recipient.status === 'SENT') {
            await tx.recipient.update({
                where: { id: session.recipientId },
                data: { status: 'VIEWED' }
            });
            await tx.contractAuditEvent.create({
                data: {
                    tenantId: session.tenantId,
                    envelopeId: session.recipient.envelopeId,
                    recipientId: session.recipientId,
                    actorType: ContractActorType.RECIPIENT,
                    action: ContractAuditAction.VIEWED,
                    ip, userAgent
                }
            });
            await tx.envelope.update({
                where: { id: session.recipient.envelopeId },
                data: { status: 'VIEWED' }
            });
        }
    });
}

export async function verifyOtp(publicTokenHash: string, submittedCode: string) {
    // Basic MVP stub
    const s = await prisma.signingSession.findUnique({ where: { publicTokenHash }, include: { recipient: true } });
    if (!s) throw new Error("Session invalid");

    const state = s.otpState as any;
    if (!state?.code || state.code !== submittedCode) {
        await prisma.signingSession.update({
            where: { publicTokenHash },
            data: { attemptCount: { increment: 1 } }
        });
        throw new Error("Invalid OTP");
    }

    // OTP Verified
    const r = await prisma.recipient.update({
        where: { id: s.recipientId },
        data: { status: 'OTP_VERIFIED' }
    });

    await appendAuditEvent({
        tenantId: s.tenantId,
        envelopeId: s.recipient.envelopeId,
        recipientId: s.recipientId,
        actorType: 'RECIPIENT',
        action: 'OTP_VERIFIED'
    });

    return { success: true };
}

export async function submitSignature(publicTokenHash: string, ip?: string, userAgent?: string) {
    const session = await fetchSession(publicTokenHash);
    if (!session || session.expired || session.tokenUsedAt) throw new Error("Invalid or expired session");

    const recipient = session.recipient;
    const envelope = recipient.envelope;

    // Auth Check
    if (recipient.authMethod !== 'NONE' && recipient.status !== 'OTP_VERIFIED') {
        throw new Error("MFA verification required before signing.");
    }

    // Order Check
    if (!enforceOrderIndex(envelope.recipients, recipient.id)) {
        throw new Error("It's not your turn to sign yet.");
    }

    const providerConfig = await prisma.signatureProviderConfig.findFirst({
        where: { tenantId: session.tenantId, isActive: true }
    });

    if (!providerConfig) {
        throw new Error("No active e-signature configuration provider for this tenant.");
    }

    const provider = getProvider(providerConfig.providerKey);
    const documentBlobId = envelope.documentVersion.fileBlobId || "";
    if (!documentBlobId) throw new Error("PDF not rendered yet.");

    // State flow - transition to SIGNING
    await prisma.$transaction(async (tx) => {
        await tx.recipient.update({
            where: { id: recipient.id },
            data: { status: 'SIGNING' }
        });

        await tx.envelope.update({
            where: { id: envelope.id },
            data: { status: 'SIGNING' }
        });

        await tx.signingSession.update({
            where: { id: session.id },
            data: { tokenUsedAt: new Date(), lastIp: ip, userAgent: userAgent }
        });

        await tx.contractAuditEvent.create({
            data: {
                tenantId: session.tenantId,
                envelopeId: envelope.id,
                recipientId: recipient.id,
                actorType: ContractActorType.RECIPIENT,
                action: ContractAuditAction.SIGN_STARTED,
                ip, userAgent,
                meta: { providerKey: providerConfig.providerKey }
            }
        });
    });

    const signingRequest = await provider.createSigningRequest({
        envelopeId: envelope.id,
        recipientId: recipient.id,
        documentBlobId
    });

    return { success: true, redirectUrl: signingRequest.redirectUrl, providerRef: signingRequest.providerRef };
}
