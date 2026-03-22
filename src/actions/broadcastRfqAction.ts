"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Autonomous RFQ Routing Engine
 * Broadcasts a buyer's demand to all capable suppliers in the network natively.
 */
export async function broadcastRfqAction(globalProductId: string, quantity: number, targetPrice?: number) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const buyerCompanyId = user.companyId || session?.companyId;
    if (!buyerCompanyId) {
        throw new Error("Buyer company context missing");
    }

    if (quantity <= 0) {
        throw new Error("Quantity must be greater than zero.");
    }

    // 1. Intelligence Routing: Find all ACTIVE sellers of this global product
    const capableListings = await prisma.networkListing.findMany({
        where: {
            globalProductId: globalProductId,
            status: "ACTIVE",
            // Optionally, we could filter by minimum availableQty if we knew the requirement was strict
            // availableQty: { gte: quantity }
        },
        select: {
            sellerCompanyId: true,
        }
    });

    if (capableListings.length === 0) {
        return { success: false, message: "Ağda bu ürünü sağlayan aktif bir tedarikçi bulunamadı." };
    }

    // Remove duplicates if a seller listed it multiple times for some reason
    const uniqueSellerIds = Array.from(new Set(capableListings.map(l => l.sellerCompanyId)));

    // Prevent buyers from sending RFQs to themselves
    const filteredSellerIds = uniqueSellerIds.filter(id => id !== buyerCompanyId);

    if (filteredSellerIds.length === 0) {
        return { success: false, message: "Ağda bu ürünü sağlayan sizden başka tedarikçi bulunamadı." };
    }

    // 2. Create the RFQ and automatically fan out RfqItems to all targeted sellers
    const createdRfqId = await prisma.$transaction(async (tx) => {
        const rfq = await tx.rfq.create({
            data: {
                buyerCompanyId,
                status: "PUBLISHED", // Immediately published to network, no DRAFT step required
            }
        });

        // 3. Fan-out to Network Suppliers
        const itemsToCreate = filteredSellerIds.map(sellerId => ({
            rfqId: rfq.id,
            productId: globalProductId,
            sellerCompanyId: sellerId,
            quantity: quantity,
            targetPrice: targetPrice || null
        }));

        await tx.rfqItem.createMany({
            data: itemsToCreate
        });

        return rfq.id;
    });

    revalidatePath("/rfq");
    // Also revalidate seller endpoints so they get real-time network updates if they refresh
    revalidatePath("/seller/rfqs");

    return { success: true, rfqId: createdRfqId, targetCount: filteredSellerIds.length };
}
