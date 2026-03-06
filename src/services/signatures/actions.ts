"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function createSignatureEnvelope(data: { title: string; documentKey: string; documentFileName: string; provider?: string }) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const tenantId = session.companyId || (session as any).tenantId;

        const envelope = await prisma.signatureEnvelope.create({
            data: {
                tenantId,
                companyId: session.companyId,
                title: data.title,
                documentKey: data.documentKey,
                documentFileName: data.documentFileName,
                provider: data.provider || "INTERNAL",
                createdByUserId: session.id,
                status: "DRAFT"
            }
        });

        return { success: true, envelope };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addSignatureRecipient(data: { envelopeId: string; name: string; email: string; phone?: string; role?: 'SIGNER' | 'CC' | 'APPROVER'; orderIndex?: number }) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");
        const tenantId = session.companyId || (session as any).tenantId;

        const envelope = await prisma.signatureEnvelope.findUnique({ where: { id: data.envelopeId } });
        if (!envelope || envelope.tenantId !== tenantId) throw new Error("Envelope not found or unauthorized");
        if (envelope.status !== 'DRAFT') throw new Error("Can only add recipients to DRAFT envelopes");

        const recipient = await prisma.signatureRecipient.create({
            data: {
                envelopeId: data.envelopeId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role || 'SIGNER',
                orderIndex: data.orderIndex || 0,
                status: 'PENDING'
            }
        });

        return { success: true, recipient };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function startSignatureSession(envelopeId: string) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");
        const tenantId = session.companyId || (session as any).tenantId;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id: envelopeId },
            include: { recipients: true }
        });
        if (!envelope || envelope.tenantId !== tenantId) throw new Error("Envelope not found");
        if (envelope.status !== 'DRAFT') throw new Error("Envelope is already started");

        // Set status to PENDING
        await prisma.signatureEnvelope.update({
            where: { id: envelopeId },
            data: { status: 'PENDING' }
        });

        // Generate sessions for all PENDING recipients
        for (const r of envelope.recipients) {
            const rawToken = crypto.randomUUID() + "-" + Date.now();
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            // 7 day expiry
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.signatureSession.create({
                data: {
                    envelopeId: envelope.id,
                    recipientId: r.id,
                    tokenHash,
                    expiresAt
                }
            });

            // Expected workflow hook -> Trigger email via mailer here with `/portal/sign?token=${rawToken}`
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getEnvelopeDetails(envelopeId: string) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");
        const tenantId = session.companyId || (session as any).tenantId;

        const envelope = await prisma.signatureEnvelope.findUnique({
            where: { id: envelopeId },
            include: {
                recipients: {
                    orderBy: { orderIndex: 'asc' }
                },
                sessions: true
            }
        });

        if (!envelope || envelope.tenantId !== tenantId) throw new Error("Envelope not found");

        return { success: true, envelope };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
