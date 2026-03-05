"use server";

import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { generateSigningToken } from '@/services/contracts/tokens';
import { appendAuditEvent } from '@/services/contracts/audit';
import { enqueueSendEnvelope } from '@/services/contracts/jobs';
import { AuthMethod, RecipientRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createEnvelope(documentVersionId: string, recipients: { email: string, name: string, role: RecipientRole, orderIndex: number, auth: AuthMethod }[]) {
    const tenantId = await getStrictTenantId();

    const ver = await prisma.documentVersion.findFirst({
        where: { id: documentVersionId, tenantId },
        include: { document: true }
    });
    if (!ver) throw new Error("Document version not found");

    const env = await prisma.$transaction(async (tx) => {
        const _env = await tx.envelope.create({
            data: {
                tenantId,
                documentId: ver.documentId,
                documentVersionId: ver.id,
                status: 'DRAFT',
            }
        });

        for (const recipient of recipients) {
            await tx.recipient.create({
                data: {
                    tenantId,
                    envelopeId: _env.id,
                    email: recipient.email,
                    name: recipient.name,
                    role: recipient.role,
                    orderIndex: recipient.orderIndex,
                    authMethod: recipient.auth,
                    status: 'CREATED'
                }
            });
        }
        return _env;
    });

    await appendAuditEvent({
        tenantId,
        envelopeId: env.id,
        actorType: 'USER',
        action: 'CREATED',
        meta: { documentId: ver.documentId, recipientCount: recipients.length }
    });

    revalidatePath('/contracts/envelopes');
    return { success: true, envelopeId: env.id };
}

export async function sendEnvelope(envelopeId: string) {
    const tenantId = await getStrictTenantId();

    // Find envelope and its recipients
    const env = await prisma.envelope.findFirst({
        where: { id: envelopeId, tenantId, status: 'DRAFT' },
        include: { recipients: { orderBy: { orderIndex: 'asc' } } }
    });

    if (!env) throw new Error("Envelope not ready or not found");

    await prisma.$transaction(async (tx) => {
        await tx.envelope.update({
            where: { id: envelopeId },
            data: { status: 'SENT' }
        });

        // Initialize sessions & tokens
        const defaultTtlHours = 72;
        const expiresAt = new Date(Date.now() + defaultTtlHours * 3600000);

        for (const r of env.recipients) {
            const tokenSet = generateSigningToken();

            await tx.signingSession.create({
                data: {
                    tenantId,
                    recipientId: r.id,
                    publicTokenHash: tokenSet.tokenHash,
                    expiresAt: expiresAt,
                    otpState: {}
                }
            });

            await tx.recipient.update({
                where: { id: r.id },
                data: { status: 'SENT' }
            });

            // Note: Displaying raw token in dev logs for demonstration purposes ONLY! Real system sends via email/SMS.
            console.log(`[DEV ENVELOPE: ${envelopeId}] Token for ${r.email}: ${tokenSet.rawToken}`);

            await tx.contractAuditEvent.create({
                data: {
                    tenantId,
                    envelopeId,
                    recipientId: r.id,
                    action: 'SENT',
                    actorType: 'SYSTEM',
                    meta: { email: r.email }
                }
            });
        }
    });

    // TODO PROMPT 02: Real send job
    await enqueueSendEnvelope(envelopeId);
    revalidatePath(`/contracts/envelopes/${envelopeId}`);

    return { success: true };
}

export async function fetchEnvelopes() {
    const tenantId = await getStrictTenantId();
    return prisma.envelope.findMany({
        where: { tenantId },
        include: { document: true, recipients: true },
        orderBy: { updatedAt: 'desc' }
    });
}
