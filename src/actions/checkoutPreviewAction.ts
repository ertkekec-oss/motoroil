"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartAction } from "./cartActions";
import { resolveContractPrice } from "@/lib/pricingResolver";

export async function checkoutPreviewAction() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const cart = await getCartAction();
    if (!cart || cart.length === 0) {
        throw new Error("Cart is empty");
    }

    // Group cart items by seller
    const sellerGroups = new Map<string, typeof cart>();
    for (const item of cart) {
        if (!sellerGroups.has(item.sellerCompanyId)) {
            sellerGroups.set(item.sellerCompanyId, []);
        }
        sellerGroups.get(item.sellerCompanyId)!.push(item);
    }

    const preview = [];
    let grandTotal = 0;

    for (const [sellerId, items] of sellerGroups.entries()) {
        let subtotalAmount = 0;

        const seller = await prisma.company.findUnique({ where: { id: sellerId } });
        const sellerName = seller?.name || "Unknown Seller";

        for (const item of items) {
            const resolved = await resolveContractPrice(user.companyId || session?.companyId, sellerId, item.productId, item.qty);
            subtotalAmount += resolved.unitPrice * item.qty;
        }

        const platformCommission = subtotalAmount * 0.05; // 5% mock commission
        const escrowFee = subtotalAmount * 0.01; // 1% escrow fee
        const orderTotal = subtotalAmount + escrowFee;
        grandTotal += orderTotal;

        preview.push({
            sellerCompanyId: sellerId,
            sellerName,
            subtotalAmount,
            platformCommission,
            escrowFee,
            orderTotal
        });
    }

    return {
        groups: preview,
        grandTotal
    };
}
