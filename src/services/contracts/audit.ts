import { prisma } from '@/lib/prisma';
import { ContractAuditAction, ContractActorType } from '@prisma/client';

interface AuditEventParams {
    tenantId: string;
    envelopeId?: string;
    recipientId?: string;
    actorType: ContractActorType;
    actorId?: string;
    action: ContractAuditAction;
    ip?: string;
    userAgent?: string;
    meta?: Record<string, any>;
}

export async function appendAuditEvent(params: AuditEventParams) {
    try {
        await prisma.contractAuditEvent.create({
            data: {
                tenantId: params.tenantId,
                envelopeId: params.envelopeId,
                recipientId: params.recipientId,
                actorType: params.actorType,
                actorId: params.actorId,
                action: params.action,
                ip: params.ip,
                userAgent: params.userAgent,
                meta: params.meta ? params.meta : undefined
            }
        });
    } catch (e) {
        console.error("Failed to append Contract Audit Event: ", e);
    }
}
