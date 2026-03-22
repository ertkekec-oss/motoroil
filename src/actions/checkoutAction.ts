"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartAction, clearCartAction } from "./cartActions";
import { revalidatePath } from "next/cache";

import crypto from "crypto";

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
                where: { id: listing.id },
                data: { availableQty: { decrement: item.qty } }
            });
        }

        const shippingAmount = 0; // Or standard standard shipping cost calculation
        const totalAmount = subtotalAmount + shippingAmount;
        
        // 5% Platform Commission
        const commissionAmount = totalAmount * 0.05;
        const netAmount = totalAmount - commissionAmount;

        const itemsHash = crypto.createHash("sha256").update(JSON.stringify(orderItems)).digest("hex");

        // Create the Network Order with Escrow Architecture
        const order = await prisma.networkOrder.create({
            data: {
                buyerCompanyId: buyerCompanyId,
                sellerCompanyId: sellerId,
                subtotalAmount,
                shippingAmount,
                totalAmount,
                commissionAmount,
                currency: "TRY",
                status: "PROCESSING",
                items: orderItems,
                itemsHash,
                payments: {
                    create: {
                        provider: "ODEL",
                        mode: "ESCROW",
                        status: "PAID", // Simulated payment success
                        amount: totalAmount,
                        currency: "TRY",
                        payoutStatus: "INITIATED",
                        providerPaymentKey: `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                    }
                },
                shipments: {
                    create: {
                        status: "PENDING",
                        sequence: 1,
                        carrierCode: "SYSTEM",
                    }
                }
            },
            include: { shipments: true }
        });

        // Create Seller Earning mapping to the shipment
        await prisma.sellerEarning.create({
            data: {
                sellerCompanyId: sellerId,
                shipmentId: order.shipments[0].id,
                grossAmount: totalAmount,
                commissionAmount: commissionAmount,
                netAmount: netAmount,
                currency: "TRY",
                status: "PENDING",
                expectedClearDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
        });

        // Update the Ledger Account (Escrow Kasa Entegrasyonu)
        await prisma.ledgerAccount.upsert({
            where: { companyId: sellerId },
            create: {
                companyId: sellerId,
                pendingBalance: netAmount,
                availableBalance: 0,
                reservedBalance: 0,
                currency: "TRY"
            },
            update: {
                pendingBalance: { increment: netAmount }
            }
        });
    }

    await clearCartAction();

    revalidatePath("/catalog");
    revalidatePath("/hub/buyer/orders");

    return { success: true };
}
