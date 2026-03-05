"use server";

import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';

export async function createProviderConfig(providerKey: string, payload: any) {
    const tenantId = await getStrictTenantId();

    // Check if duplicate
    const exists = await prisma.signatureProviderConfig.findUnique({
        where: { tenantId_providerKey: { tenantId, providerKey } }
    });

    if (exists) throw new Error("Provider already configured.");

    await prisma.signatureProviderConfig.create({
        data: {
            tenantId,
            providerKey,
            credentialsEncrypted: JSON.stringify(payload), // MVP stub. TODO PROMPT 03 encryption
            isActive: true
        }
    });

    return { success: true };
}

export async function fetchProviderConfigs() {
    const tenantId = await getStrictTenantId();
    return prisma.signatureProviderConfig.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function fetchAuditLogs() {
    const tenantId = await getStrictTenantId();
    return prisma.contractAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100
    });
}
