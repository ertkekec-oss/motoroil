
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SuggestionStatus, ActorType, CommerceAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createCommerceAuditLog } from "@/services/network/auditService";
import { applySuggestion } from "@/services/network/suggestionService";

export async function acceptSuggestionAction(suggestionId: string) {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) throw new Error("Unauthorized");
    const companyId = user.companyId;

    const result = await applySuggestion(suggestionId, companyId, ActorType.SELLER);

    revalidatePath("/seller/suggestions");
    revalidatePath("/seller/products");
    revalidatePath("/catalog");

    return result;
}

export async function dismissSuggestionAction(suggestionId: string) {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) throw new Error("Unauthorized");
    const companyId = user.companyId;

    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + 7); // 7 days suppression

    await prisma.b2BSuggestion.update({
        where: { id: suggestionId, sellerCompanyId: companyId },
        data: {
            status: SuggestionStatus.DISMISSED,
            dismissedUntil
        }
    });

    await createCommerceAuditLog({
        sellerCompanyId: companyId,
        actorType: ActorType.SELLER,
        action: CommerceAction.SUGGESTION_DISMISS,
        entityType: "B2BSuggestion",
        entityId: suggestionId
    });

    revalidatePath("/seller/suggestions");
    return { success: true };
}
