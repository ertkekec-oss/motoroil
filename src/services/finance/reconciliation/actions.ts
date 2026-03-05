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
