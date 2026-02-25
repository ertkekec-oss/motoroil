"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { initiateShipment } from "@/services/shipment/init"; // that huge secure block we created

export async function initiateShipmentAction(orderId: string, payload: any) {
    const session = await getSession();
    if (!session?.settings?.companyId) throw new Error("Unauthorized");

    const perms: string[] = session.permissions || [];
    if (!perms.includes("network_sell") && session.role !== "SUPER_ADMIN" && session.role !== "admin") {
        throw new Error("Forbidden Role: You cannot ship goods without network_sell scope.");
    }

    try {
        const result = await initiateShipment({
            networkOrderId: orderId,
            sellerCompanyId: session.settings.companyId,
            carrierCode: payload.carrierCode || 'MOCK',
            items: payload.items || undefined, // Array of { productId, qty } from client 
        });

        revalidatePath(`/network/seller/orders/${orderId}`);
        revalidatePath(`/network/seller/orders`);

        return result;
    } catch (e: any) {
        throw new Error(e.message || "Kargo başlatılırken hata oluştu.");
    }
}
