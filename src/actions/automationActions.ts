
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActorType, CommerceAction, Visibility } from "@prisma/client";
import { createCommerceAuditLog } from "@/services/network/auditService";

export async function saveAutomationPolicyAction(formData: FormData) {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) throw new Error("Unauthorized");
    const companyId = user.companyId;

    const autoPublishEnabled = formData.get("autoPublishEnabled") === "true";
    const minOnHandThreshold = parseInt(formData.get("minOnHandThreshold") as string) || 100;
    const lowSalesThreshold = parseInt(formData.get("lowSalesThreshold") as string) || 3;
    const maxReservedRatio = parseFloat(formData.get("maxReservedRatio") as string) || 0.2;
    const defaultMinOrderQty = parseInt(formData.get("defaultMinOrderQty") as string) || 1;
    const defaultLeadTimeDays = parseInt(formData.get("defaultLeadTimeDays") as string) || 3;
    const defaultVisibility = (formData.get("defaultVisibility") as Visibility) || Visibility.NETWORK;

    const policy = await prisma.sellerAutomationPolicy.upsert({
        where: { sellerCompanyId: companyId },
        create: {
            sellerCompanyId: companyId,
            autoPublishEnabled,
            minOnHandThreshold,
            lowSalesThreshold,
            maxReservedRatio,
            defaultMinOrderQty,
            defaultLeadTimeDays,
            defaultVisibility
        },
        update: {
            autoPublishEnabled,
            minOnHandThreshold,
            lowSalesThreshold,
            maxReservedRatio,
            defaultMinOrderQty,
            defaultLeadTimeDays,
            defaultVisibility
        }
    });

    await createCommerceAuditLog({
        sellerCompanyId: companyId,
        actorType: ActorType.SELLER,
        action: CommerceAction.POLICY_UPDATE,
        entityType: "SellerAutomationPolicy",
        entityId: policy.id,
        payload: { policy }
    });

    revalidatePath("/seller/automation");
    return { success: true };
}
