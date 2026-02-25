"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCartAction, clearCartAction } from "@/actions/cartActions";
import { revalidatePath } from "next/cache";

export async function createRfqFromCartAction() {
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

    const createdRfqId = await prisma.$transaction(async (tx) => {
        // Create the base RFQ
        const rfq = await tx.rfq.create({
            data: {
                buyerCompanyId,
                status: "DRAFT",
            }
        });

        // Add items to RFQ
        const rfqItemsData = cart.map(item => ({
            rfqId: rfq.id,
            productId: item.productId,
            sellerCompanyId: item.sellerCompanyId,
            quantity: item.qty,
        }));

        await tx.rfqItem.createMany({
            data: rfqItemsData
        });

        return rfq.id;
    });

    await clearCartAction();

    revalidatePath("/catalog");
    revalidatePath("/catalog/cart");

    return { success: true, rfqId: createdRfqId };
}

export async function submitRfqAction(rfqId: string) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const buyerCompanyId = user.companyId || session?.companyId;
    if (!buyerCompanyId) {
        throw new Error("Buyer company context missing");
    }

    const rfq = await prisma.rfq.findUnique({
        where: { id: rfqId }
    });

    if (!rfq || rfq.buyerCompanyId !== buyerCompanyId) {
        throw new Error("RFQ not found or access denied.");
    }

    if (rfq.status !== "DRAFT") {
        throw new Error("RFQ has already been submitted or is not in DRAFT state.");
    }

    await prisma.rfq.update({
        where: { id: rfqId },
        data: { status: "SENT" }
    });

    revalidatePath(`/rfq/${rfqId}`);
    revalidatePath(`/rfq`);

    return { success: true };
}
