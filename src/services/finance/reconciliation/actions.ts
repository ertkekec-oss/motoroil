"use server";

import { createReconciliation } from "./core";
import { prisma } from "@/lib/prisma";
import { ReconDeliveryMethod, ReconAuthMethod } from "@prisma/client";
import { sendMail } from "@/lib/mail";
import crypto from "crypto";

export async function createReconAction(data: {
    tenantId: string;
    accountId: string;
    periodStart: string;
    periodEnd: string;
}) {
    try {
        const recon = await createReconciliation({
            tenantId: data.tenantId,
            accountId: data.accountId,
            periodStart: new Date(data.periodStart),
            periodEnd: new Date(data.periodEnd)
        });

        // Add audit log
        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: data.tenantId,
                reconciliationId: recon.id,
                action: 'CREATED',
                metaJson: { createdBy: 'ServerAction' }
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: data.tenantId,
                reconciliationId: recon.id,
                action: 'SNAPSHOT_GENERATED'
            }
        });

        return { success: true, reconciliation: recon };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function sendReconAction(data: {
    reconciliationId: string;
    deliveryMethod: ReconDeliveryMethod;
    authMethod: ReconAuthMethod;
}) {
    // Basic mock of sending for MVP.
    try {
        const recon = await prisma.reconciliation.findUnique({
            where: { id: data.reconciliationId }
        });

        if (!recon) throw new Error("Not found");

        const updated = await prisma.reconciliation.update({
            where: { id: data.reconciliationId },
            data: {
                status: 'SENT',
                deliveryMethod: data.deliveryMethod,
                authMethod: data.authMethod,
                sentAt: new Date(),
                dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'SENT',
                metaJson: { deliveryMethod: data.deliveryMethod }
            }
        });

        // Generate Token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.reconciliationPortalToken.create({
            data: {
                reconciliationId: recon.id,
                tokenHash,
                expiresAt,
                companyId: recon.companyId
            }
        });

        // ACTUALLY SEND THE EMAIL via Mail Engine
        const account = await prisma.customer.findUnique({ where: { id: recon.accountId } });
        if (account && account.email && data.deliveryMethod === 'EMAIL') {
            const documentLink = `https://www.periodya.com/portal/mutabakat/access?token=${rawToken}`;

            await sendMail({
                to: account.email,
                subject: `Mutabakat Talebi: ${recon.periodStart.toLocaleDateString()} - ${recon.periodEnd.toLocaleDateString()}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Yeni Mutabakat Kaydı Talebi</h1>
                        </div>
                        <div style="padding: 32px; background-color: #ffffff;">
                            <h2 style="color: #334155; margin-top: 0; font-size: 20px;">Merhaba ${account.name || ''},</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                                Şirketimiz ile aranızdaki <strong>${recon.periodStart.toLocaleDateString()}</strong> - <strong>${recon.periodEnd.toLocaleDateString()}</strong> dönemine ait hesap mutabakatı Periodya sistemimiz üzerinden oluşturulmuştur.
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${documentLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    Mutabakatı İncele ve Onayla
                                </a>
                            </div>
                            <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                                Bu işlem için dijital mutabakat merkezimizi kullanabilirsiniz. Belirtilen tarihe kadar (7 gün) lütfen dönüş yapınız.
                            </p>
                        </div>
                    </div>
                `,
                tenantId: recon.tenantId,
                companyId: recon.companyId,
                category: 'RECONCILIATION_INVITATION',
                relatedEntityType: 'Reconciliation',
                relatedEntityId: recon.id
            });
        }

        return { success: true, reconciliation: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function resendReconAction(reconId: string) {
    try {
        const recon = await prisma.reconciliation.findUnique({ where: { id: reconId } });
        if (!recon) throw new Error("Reconciliation not found");

        if (['SIGNED', 'VOID'].includes(recon.status)) {
            throw new Error(`Cannot resend. Status is ${recon.status}`);
        }

        const updated = await prisma.reconciliation.update({
            where: { id: reconId },
            data: {
                sentAt: new Date(),
                dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'SENT',
                metaJson: { note: 'Resent verification link.' }
            }
        });

        // Invalidate old tokens
        await prisma.reconciliationPortalToken.updateMany({
            where: { reconciliationId: recon.id, revokedAt: null, usedAt: null },
            data: { revokedAt: new Date() }
        });

        // Generate new Token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.reconciliationPortalToken.create({
            data: {
                reconciliationId: recon.id,
                tokenHash,
                expiresAt,
                companyId: recon.companyId
            }
        });

        // ACTUALLY SEND THE EMAIL
        const account = await prisma.customer.findUnique({ where: { id: recon.accountId } });
        if (account && account.email && recon.deliveryMethod === 'EMAIL') {
            const documentLink = `https://www.periodya.com/portal/mutabakat/access?token=${rawToken}`;
            await sendMail({
                to: account.email,
                subject: `Hatırlatma: Mutabakat Talebiniz Bekliyor`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mutabakat Hatırlatması</h1>
                        </div>
                        <div style="padding: 32px; background-color: #ffffff;">
                            <h2 style="color: #334155; margin-top: 0; font-size: 20px;">Merhaba ${account.name || ''},</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                                Daha önce size iletmiş olduğumuz <strong>${recon.periodStart.toLocaleDateString()}</strong> - <strong>${recon.periodEnd.toLocaleDateString()}</strong> dönemine ait mutabakatımız henüz onaylanmamıştır veya işlemsiz kalmıştır.
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${documentLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                    Mutabakata Git
                                </a>
                            </div>
                        </div>
                    </div>
                `,
                companyId: recon.companyId
            });
        }

        return { success: true, reconciliation: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function voidReconAction(reconId: string, reason: string) {
    try {
        const recon = await prisma.reconciliation.findUnique({ where: { id: reconId } });
        if (!recon) throw new Error("Reconciliation not found");

        if (recon.status === 'SIGNED') {
            throw new Error("Cannot void a SIGNED reconciliation");
        }

        const updated = await prisma.reconciliation.update({
            where: { id: reconId },
            data: { status: 'VOID' }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'VOIDED',
                metaJson: { reason }
            }
        });

        return { success: true, reconciliation: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function exportReconEvidenceAction(reconId: string) {
    try {
        // Mocking queue event for export
        const recon = await prisma.reconciliation.findUnique({ where: { id: reconId } });
        if (!recon) throw new Error("Reconciliation not found");

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'CREATED',
                metaJson: { customAction: 'EXPORT_QUEUED', timestamp: new Date() }
            }
        });

        return { success: true, message: "Export job enqueued successfully" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function openReconDisputeAction(reconId: string, reason: string, notes: string) {
    try {
        const recon = await prisma.reconciliation.findUnique({ where: { id: reconId } });
        if (!recon) throw new Error("Reconciliation not found");

        if (['SIGNED', 'VOID'].includes(recon.status)) {
            throw new Error(`Cannot dispute a ${recon.status} reconciliation`);
        }

        // State update
        const updated = await prisma.reconciliation.update({
            where: { id: reconId },
            data: { status: 'DISPUTED' }
        });

        await prisma.reconciliationDispute.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                companyId: recon.companyId,
                message: `${reason}: ${notes}`,
                status: 'OPEN'
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'DISPUTE_OPENED',
                metaJson: { reason, notes }
            }
        });

        return { success: true, reconciliation: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateDisputeStatusAction(disputeId: string, status: 'OPEN' | 'RESOLVED' | 'REJECTED') {
    try {
        const dispute = await prisma.reconciliationDispute.findUnique({ where: { id: disputeId } });
        if (!dispute) throw new Error("Dispute not found");

        const updated = await prisma.reconciliationDispute.update({
            where: { id: disputeId },
            data: {
                status: status as any,
                resolvedAt: status === 'RESOLVED' ? new Date() : null
            }
        });

        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: dispute.tenantId,
                reconciliationId: dispute.reconciliationId,
                action: status === 'RESOLVED' ? 'DISPUTE_RESOLVED' : 'DISPUTE_REJECTED' as any,
                metaJson: { disputeId, newStatus: status }
            }
        });

        return { success: true, dispute: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function addDisputeInternalNoteAction(disputeId: string, note: string) {
    try {
        const dispute = await prisma.reconciliationDispute.findUnique({ where: { id: disputeId } });
        if (!dispute) throw new Error("Dispute not found");

        const updated = await prisma.reconciliationDispute.update({
            where: { id: disputeId },
            data: { internalNotes: note }
        });

        return { success: true, dispute: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function assignDisputeAction(disputeId: string, assigneeId: string | null) {
    try {
        const dispute = await prisma.reconciliationDispute.findUnique({ where: { id: disputeId } });
        if (!dispute) throw new Error("Dispute not found");

        const updated = await prisma.reconciliationDispute.update({
            where: { id: disputeId },
            data: { assigneeId }
        });

        return { success: true, dispute: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

