"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartAction, clearCartAction } from "./cartActions";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';
import { resolveContractPrice } from "@/lib/pricingResolver";

export async function createOrdersFromCartAction(checkoutAttemptKey: string) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const buyerCompanyId = user.companyId || session?.companyId;
    if (!buyerCompanyId) {
        throw new Error("Buyer company context missing");
    }

    // Idempotency Check
    const existingPaymentInfo = await prisma.networkPayment.findFirst({
        where: { attemptKey: checkoutAttemptKey }
    });

    if (existingPaymentInfo) {
        // Idempotent return
        return { success: true, message: "Order previously submitted." };
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

    // Since we need to use a transaction for safety
    await prisma.$transaction(async (tx) => {
        for (const [sellerId, items] of sellerGroups.entries()) {
            const orderItems: any[] = [];
            let subtotalAmount = 0;
            let hasContractItems = false;
            let contractId: string | null = null;

            for (const item of items) {
                const listing = await tx.networkListing.findFirst({
                    where: {
                        sellerCompanyId: sellerId,
                        globalProductId: item.productId,
                        status: "ACTIVE"
                    },
                    include: { globalProduct: true }
                });

                if (!listing) {
                    throw new Error(`Item missing or inactive from catalog.`);
                }

                if (listing.availableQty < item.qty) {
                    throw new Error(`Insufficient stock for ${listing.globalProduct?.name || ''}. Requested: ${item.qty}, Available: ${listing.availableQty}`);
                }

                const resolved = await resolveContractPrice(buyerCompanyId, sellerId, item.productId, item.qty, tx);
                const itemTotal = resolved.unitPrice * item.qty;
                subtotalAmount += itemTotal;

                if (resolved.contractId) {
                    hasContractItems = true;
                    contractId = resolved.contractId;
                }

                orderItems.push({
                    globalProductId: item.productId,
                    erpProductId: listing.erpProductId,
                    listingId: listing.id,
                    name: listing.globalProduct?.name || "Unknown Product",
                    price: resolved.unitPrice,
                    qty: item.qty,
                    total: itemTotal,
                    isContractPriced: !!resolved.contractId
                });

                // Standard stock deduction
                await tx.networkListing.update({
                    where: { id: listing.id },
                    data: { availableQty: { decrement: item.qty } }
                });
            }

            const commissionAmount = subtotalAmount * 0.05; // 5% mock commission
            const shippingAmount = 0; // Not calculated yet
            const escrowFee = subtotalAmount * 0.01; // 1% escrow fee
            const totalAmount = subtotalAmount + shippingAmount + escrowFee;

            // Generate itemsHash
            const itemsHash = crypto.createHash("sha256").update(JSON.stringify(orderItems)).digest("hex");

            // Create NetworkOrder
            const networkOrder = await tx.networkOrder.create({
                data: {
                    buyerCompanyId,
                    sellerCompanyId: sellerId,
                    subtotalAmount,
                    shippingAmount,
                    commissionAmount,
                    totalAmount,
                    currency: "TRY",
                    status: "INIT",
                    itemsHash,
                    items: orderItems,
                    networkItems: { create: orderItems },
                    sourceType: hasContractItems ? "CONTRACT" : "CART",
                    sourceId: contractId,
                }
            });

            // Create NetworkPayment under ESCROW mode (Mock Provider)
            await tx.networkPayment.create({
                data: {
                    networkOrderId: networkOrder.id,

                    provider: "MOCK",
                    mode: "ESCROW",
                    status: "INITIATED",
                    amount: totalAmount,
                    currency: "TRY",
                    attemptKey: checkoutAttemptKey + "-" + sellerId,
                }
            });

            // Create Shipment sequence 1 Root
            await tx.shipment.create({
                data: {
                    networkOrderId: networkOrder.id,
                    mode: "MANUAL",
                    status: "CREATED",
                    carrierCode: "UNASSIGNED",
                    sequence: 1,
                    items: orderItems
                }
            });
        }
    });

    await clearCartAction();

    revalidatePath("/catalog");
    revalidatePath("/network/buyer/orders");

    return { success: true };
}
