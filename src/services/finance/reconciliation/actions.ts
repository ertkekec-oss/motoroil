"use server";

import { createReconciliation } from "./core";
import { prisma } from "@/lib/prisma";
import { ReconDeliveryMethod, ReconAuthMethod } from "@prisma/client";

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
                reason: reason as any,
                notes,
                createdByActorType: 'USER'
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
