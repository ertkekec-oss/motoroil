"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { confirmDelivery } from "@/services/orders/confirmDelivery";
// we can re-use the rate limiter conceptually from middleware/route but Server Actions are slightly harder to protect via standard next request.
// Ideal way is to pass pure ID. We'll rely on idempotency for now.

export async function confirmDeliveryAction(orderId: string) {
    const session = await getSession();
    if (!session?.settings?.companyId) {
        throw new Error("Unauthorized");
    }

    const perms: string[] = session.permissions || [];
    if (!perms.includes("network_buy") && session.role !== "SUPER_ADMIN" && session.role !== "admin") {
        throw new Error("Forbidden Role");
    }

    try {
        const result = await confirmDelivery(orderId, session.settings.companyId);

        // Revalidate the specific order detail page and list
        revalidatePath(`/network/buyer/orders/${orderId}`);
        revalidatePath(`/network/buyer/orders`);

        return result;
    } catch (e: any) {
        throw new Error(e.message || "Bilinmeyen bir hata oluştu.");
    }
}
