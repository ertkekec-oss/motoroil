import prisma from "@/lib/prisma";

type AuditInput = {
    tenantId: string;
    type: string;
    actorUserId?: string | null;
    actorDealerUserId?: string | null;
    actorIp?: string | null;
    actorUa?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    membershipId?: string | null;
    meta?: any;
};

export async function auditLog(input: AuditInput) {
    try {
        await prisma.auditEvent.create({
            data: {
                tenantId: input.tenantId,
                type: input.type as any,
                actorUserId: input.actorUserId ?? null,
                actorDealerUserId: input.actorDealerUserId ?? null,
                actorIp: input.actorIp ?? null,
                actorUa: input.actorUa ?? null,
                entityType: input.entityType ?? null,
                entityId: input.entityId ?? null,
                membershipId: input.membershipId ?? null,
                meta: input.meta ?? undefined,
            },
        });
    } catch {
        // fail-open: audit must not break business flows
    }
}
