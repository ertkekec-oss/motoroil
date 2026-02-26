import { PrismaClient, Prisma } from '@prisma/client';

export async function createFinanceAuditLog(
    tx: Prisma.TransactionClient,
    action: string,
    actor: string,
    entityId: string,
    entityType: string,
    payload: any
) {
    return await tx.financeAuditLog.create({
        data: {
            tenantId: 'PLATFORM_TENANT_CONST', // Ensure tenantId is valid (assuming PLATFORM_TENANT_CONST resolves to an existing Company ID as modeled in FinanceAuditLog)
            action,
            actor,
            entityId,
            entityType,
            payloadJson: payload
        }
    });
}
