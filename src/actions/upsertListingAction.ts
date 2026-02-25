"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertListingAction(formData: FormData) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        throw new Error("Unauthorized");
    }

    const companyId = user.companyId || session?.companyId;

    const erpProductId = formData.get("erpProductId") as string;
    const priceStr = formData.get("price") as string;
    const availableQtyStr = formData.get("availableQty") as string;
    const minQtyStr = formData.get("minQty") as string;
    const leadTimeDaysStr = formData.get("leadTimeDays") as string;
    const status = formData.get("status") as "ACTIVE" | "PAUSED";

    if (!erpProductId || !priceStr || !availableQtyStr || !status) {
        throw new Error("Missing required fields");
    }

    const price = parseFloat(priceStr);
    const availableQty = parseInt(availableQtyStr);
    const minQty = parseInt(minQtyStr) || 1;
    const leadTimeDays = parseInt(leadTimeDaysStr) || 0;

    // Load the ERP Product
    const erpProduct = await prisma.product.findUnique({
        where: { id: erpProductId }
    });

    if (!erpProduct || erpProduct.companyId !== companyId) {
        throw new Error("Product not found or unauthorized");
    }

    // MVP: Auto-create or find GlobalProduct by Barcode or Name to simplify mapping
    let globalProduct;
    if (erpProduct.barcode) {
        globalProduct = await prisma.globalProduct.findFirst({
            where: { barcode: erpProduct.barcode }
        });
    }

    // Fallback to name match or create entirely
    if (!globalProduct) {
        globalProduct = await prisma.globalProduct.findFirst({
            where: { name: erpProduct.name }
        });
    }

    if (!globalProduct) {
        globalProduct = await prisma.globalProduct.create({
            data: {
                name: erpProduct.name,
                barcode: erpProduct.barcode || null,
                category: erpProduct.category || null,
                description: erpProduct.description || null,
            }
        });
    }

    // Load existing listing for audit log
    const existingListing = await prisma.networkListing.findUnique({
        where: {
            sellerCompanyId_erpProductId: {
                sellerCompanyId: companyId,
                erpProductId: erpProductId
            }
        }
    });

    // Upsert Network Listing
    const listing = await prisma.networkListing.upsert({
        where: {
            sellerCompanyId_erpProductId: {
                sellerCompanyId: companyId,
                erpProductId: erpProductId
            }
        },
        create: {
            sellerCompanyId: companyId,
            erpProductId: erpProductId,
            globalProductId: globalProduct.id,
            price,
            availableQty,
            minQty,
            leadTimeDays,
            status
        },
        update: {
            price,
            availableQty,
            minQty,
            leadTimeDays,
            status
        }
    });

    // Audit Logging
    const { createCommerceAuditLog } = await import("@/services/network/auditService");
    const { ActorType, CommerceAction } = await import("@prisma/client");

    const diff: any = {};
    if (existingListing) {
        if (Number(existingListing.price) !== price) diff.price = { old: Number(existingListing.price), new: price };
        if (existingListing.availableQty !== availableQty) diff.availableQty = { old: existingListing.availableQty, new: availableQty };
        if (existingListing.minQty !== minQty) diff.minQty = { old: existingListing.minQty, new: minQty };
        if (existingListing.leadTimeDays !== leadTimeDays) diff.leadTimeDays = { old: existingListing.leadTimeDays, new: leadTimeDays };
        if (existingListing.status !== status) diff.status = { old: existingListing.status, new: status };
    }

    await createCommerceAuditLog({
        sellerCompanyId: companyId,
        actorType: ActorType.SELLER, // Invoked from UI
        action: existingListing ? CommerceAction.ACTIVATE_LISTING : CommerceAction.CREATE_LISTING, // Rough mapping
        entityType: "NetworkListing",
        entityId: listing.id,
        payload: {
            isNew: !existingListing,
            diff: Object.keys(diff).length > 0 ? diff : undefined,
            full: listing
        }
    });

    revalidatePath("/seller/products");
    revalidatePath("/catalog");

    return { success: true };
}
