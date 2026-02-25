
import { prisma } from "@/lib/prisma";
import {
    SuggestionStatus,
    SuggestionType,
    ListingStatus,
    ActorType,
    CommerceAction
} from "@prisma/client";
import { createCommerceAuditLog } from "./auditService";

export async function applySuggestion(suggestionId: string, companyId: string, actorType: ActorType) {
    const suggestion = await prisma.b2BSuggestion.findUnique({
        where: { id: suggestionId },
        include: { product: true }
    });

    if (!suggestion || suggestion.sellerCompanyId !== companyId) {
        throw new Error("Suggestion not found");
    }

    if (suggestion.status !== SuggestionStatus.OPEN) {
        throw new Error("Suggestion already processed");
    }

    const productId = suggestion.productId!;

    // 1. Perform Action
    if (suggestion.suggestionType === SuggestionType.LIST) {
        const erpProduct = await prisma.product.findUnique({ where: { id: productId } });
        if (!erpProduct) throw new Error("Product not found");

        const gp = await getOrCreateGlobalProduct(erpProduct);
        console.log(`[SuggestionService] Applying LIST for ${productId}. GlobalProduct ID: ${gp?.id}`);

        await prisma.networkListing.upsert({
            where: { sellerCompanyId_erpProductId: { sellerCompanyId: companyId, erpProductId: productId } },
            create: {
                sellerCompanyId: companyId,
                erpProductId: productId,
                globalProductId: gp.id,
                price: erpProduct.price,
                availableQty: erpProduct.stock || 0,
                status: ListingStatus.ACTIVE
            },
            update: {
                status: ListingStatus.ACTIVE
            }
        });
    }
    else if (suggestion.suggestionType === SuggestionType.PAUSE) {
        await prisma.networkListing.updateMany({
            where: { sellerCompanyId: companyId, erpProductId: productId },
            data: { status: ListingStatus.PAUSED }
        });
    }

    // 2. Update status
    const finalStatus = actorType === ActorType.SYSTEM ? SuggestionStatus.AUTO_APPLIED : SuggestionStatus.ACCEPTED;
    const finalAction = actorType === ActorType.SYSTEM
        ? (suggestion.suggestionType === SuggestionType.PAUSE ? CommerceAction.AUTO_PAUSE : CommerceAction.AUTO_PUBLISH)
        : CommerceAction.SUGGESTION_ACCEPT;

    await prisma.b2BSuggestion.update({
        where: { id: suggestionId },
        data: { status: finalStatus }
    });

    // 3. Audit
    await createCommerceAuditLog({
        sellerCompanyId: companyId,
        actorType: actorType,
        action: finalAction,
        entityType: "B2BSuggestion",
        entityId: suggestionId,
        payload: { type: suggestion.suggestionType, productId, auto: actorType === ActorType.SYSTEM }
    });

    return { success: true, status: finalStatus };
}

export async function getOrCreateGlobalProduct(erpProduct: any) {
    let globalProduct;
    if (erpProduct.barcode) {
        globalProduct = await prisma.globalProduct.findFirst({
            where: { barcode: erpProduct.barcode }
        });
    }
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
                description: erpProduct.description || null,
            }
        });
    }
    return globalProduct;
}
