"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartAction, clearCartAction } from "./cartActions";
import { revalidatePath } from "next/cache";

export async function processCheckoutAction() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const buyerCompanyId = user.companyId || session?.companyId;
    if (!buyerCompanyId) {
        throw new Error("Buyer company context missing");
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

    // Process each seller's order
    for (const [sellerId, items] of sellerGroups.entries()) {
        const orderItems: any[] = [];
        let subtotalAmount = 0;

        for (const item of items) {
            // Find the listing
            const listing = await prisma.networkListing.findFirst({
                where: {
                    sellerCompanyId: item.sellerCompanyId,
                    globalProductId: item.productId,
                    status: "ACTIVE"
                },
                include: { globalProduct: true }
            });

            if (!listing) {
                throw new Error(`Item ${item.productId} from seller ${item.sellerCompanyId} is no longer available.`);
            }

            if (listing.availableQty < item.qty) {
                throw new Error(`Insufficient stock for ${listing.globalProduct?.name}. Requested: ${item.qty}, Available: ${listing.availableQty}`);
            }

            const itemTotal = Number(listing.price) * item.qty;
            subtotalAmount += itemTotal;

            orderItems.push({
                globalProductId: item.productId,
                erpProductId: listing.erpProductId,
                name: listing.globalProduct?.name || "Unknown Product",
                price: Number(listing.price),
                qty: item.qty,
                total: itemTotal
            });

            // Decrement Stock
            await prisma.networkListing.update({
                where: {
                    id: listing.id
                },
                data: {
                    availableQty: {
                        decrement: item.qty
                    }
                }
            });
        }

        const shippingAmount = 0; // Or standard standard shipping cost calculation
        const totalAmount = subtotalAmount + shippingAmount;

        // Create the Network Order
        await prisma.networkOrder.create({
            data: {
                buyerCompanyId: buyerCompanyId,
                sellerCompanyId: sellerId,
                subtotalAmount,
                shippingAmount,
                totalAmount,
                currency: "TRY",
                status: "PENDING_PAYMENT",
                items: orderItems,
            }
        });
    }

    await clearCartAction();

    revalidatePath("/catalog");
    revalidatePath("/network/buyer/orders");

    return { success: true };
}
