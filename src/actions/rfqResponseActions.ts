"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function counterRfqAction(formData: FormData) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const sellerCompanyId = user.companyId || session?.companyId;

    const rfqId = formData.get("rfqId") as string;
    const totalPriceStr = formData.get("totalPrice") as string;
    const expiresAtStr = formData.get("expiresAt") as string;

    if (!rfqId || !totalPriceStr) {
        throw new Error("Missing required fields");
    }

    const rfq = await prisma.rfq.findUnique({
        where: { id: rfqId },
        include: { items: true }
    });

    if (!rfq) {
        throw new Error("RFQ not found");
    }

    const sellerItems = rfq.items.filter(i => i.sellerCompanyId === sellerCompanyId);
    if (sellerItems.length === 0) {
        throw new Error("You have no items in this RFQ");
    }

    const totalPrice = parseFloat(totalPriceStr);
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : undefined;

    // Create SellerOffer
    const offer = await prisma.sellerOffer.create({
        data: {
            rfqId,
            sellerCompanyId,
            status: "COUNTERED",
            totalPrice,
            expiresAt,
            items: {
                create: sellerItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    // Assume flat uniform unit price for the bundle counter MVP.
                    // Or realistically we should capture per item, but MVP says total price is enough.
                    unitPrice: totalPrice / item.quantity // Hack for simple MVP DB schema requirements
                }))
            }
        }
    });

    await prisma.rfq.update({
        where: { id: rfqId },
        data: { status: "RESPONDED" }
    });

    revalidatePath(`/seller/rfqs`);

    return { success: true };
}

export async function acceptOfferAction(offerId: string) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const buyerCompanyId = user.companyId || session?.companyId;

    const offer = await prisma.sellerOffer.findUnique({
        where: { id: offerId },
        include: {
            rfq: true,
            items: true
        }
    });

    if (!offer || offer.rfq.buyerCompanyId !== buyerCompanyId) {
        throw new Error("Offer not found or unauthorized");
    }

    if (offer.status === "ACCEPTED") {
        throw new Error("Offer already accepted");
    }

    if (offer.expiresAt && offer.expiresAt < new Date()) {
        throw new Error("Offer expired");
    }

    // Convert to NetworkOrder inside Transaction
    await prisma.$transaction(async (tx) => {
        // Mark Offer Accepted
        await tx.sellerOffer.update({
            where: { id: offerId },
            data: { status: "ACCEPTED" }
        });

        const subtotalAmount = Number(offer.totalPrice);
        const commissionAmount = subtotalAmount * 0.05; // 5% mock
        const escrowFee = subtotalAmount * 0.01; // 1% escrow fee mock
        const totalAmount = subtotalAmount + escrowFee;

        const orderItems = offer.items.map(i => ({
            globalProductId: i.productId,
            name: "RFQ Bundle Item", // Needs populate from GlobalProduct in full version
            price: Number(i.unitPrice),
            qty: i.quantity,
            total: Number(i.unitPrice) * i.quantity
        }));

        const itemsHash = offerId; // Simple idempotency hash

        const networkOrder = await tx.networkOrder.create({
            data: {
                buyerCompanyId,
                sellerCompanyId: offer.sellerCompanyId,
                subtotalAmount,
                shippingAmount: 0,
                commissionAmount,
                totalAmount,
                currency: "TRY",
                status: "INIT",
                itemsHash,
                items: orderItems,
            }
        });

        // Initialize Escrow Payment mock
        await tx.networkPayment.create({
            data: {
                networkOrderId: networkOrder.id,
                provider: "MOCK", // Hardcoded per provider mode
                mode: "ESCROW",
                status: "INITIATED",
                amount: totalAmount,
                currency: "TRY",
                attemptKey: `chk_rfq_${offerId}`, // Lock ID
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
    });

    // We leave the RFQ explicitly open if buyer has items from OTHER sellers they haven't decided on yet.
    // If we wanted we could mark RFQ ACCEPTED if all sellers accepted.

    revalidatePath(`/rfq/${offer.rfqId}`);
    revalidatePath("/network/buyer/orders");

    return { success: true };
}
