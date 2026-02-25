
import { prisma } from "@/lib/prisma";
import { ActorType, CommerceAction } from "@prisma/client";

export interface CreateAuditLogParams {
    sellerCompanyId: string;
    actorType: ActorType;
    action: CommerceAction;
    entityType: string;
    entityId: string;
    payload?: any;
}

export async function createCommerceAuditLog({
    sellerCompanyId,
    actorType,
    action,
    entityType,
    entityId,
    payload,
}: CreateAuditLogParams) {
    try {
        return await prisma.commerceAuditLog.create({
            data: {
                sellerCompanyId,
                actorType,
                action,
                entityType,
                entityId,
                payloadJson: payload || {},
            },
        });
    } catch (error) {
        console.error("Failed to create commerce audit log:", error);
        // We don't want to throw here to avoid breaking the main flow
        return null;
    }
}
