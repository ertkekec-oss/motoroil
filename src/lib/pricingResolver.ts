import { prisma as defaultPrisma } from "@/lib/prisma";

export async function resolveContractPrice(buyerCompanyId: string, sellerCompanyId: string, productId: string, qty: number, db: any = defaultPrisma) {
    let resolvedPrice: number | null = null;
    let contractId: string | null = null;

    // Check if there's an ACTIVE contract between buyer and seller
    const contract = await db.contract.findFirst({
        where: {
            buyerCompanyId,
            sellerCompanyId,
            status: "ACTIVE"
        },
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                where: { productId },
                include: { tiers: { orderBy: { minQty: 'desc' } } }
            }
        }
    });

    if (contract && contract.items.length > 0) {
        const contractItem = contract.items[0];

        if (qty >= contractItem.minOrderQty) {
            contractId = contract.id;

            // Find applicable tier
            const applicableTier = contractItem.tiers.find(t => qty >= t.minQty);
            if (applicableTier) {
                resolvedPrice = Number(applicableTier.unitPrice);
            } else {
                resolvedPrice = Number(contractItem.baseUnitPrice);
            }
        }
    }

    if (resolvedPrice === null) {
        // Fallback to standard network listing price
        const listing = await db.networkListing.findFirst({
            where: {
                sellerCompanyId,
                globalProductId: productId,
                status: "ACTIVE"
            }
        });

        if (!listing) {
            throw new Error(`Item missing or inactive from catalog for product ${productId}`);
        }

        resolvedPrice = Number(listing.price);
    }

    return {
        unitPrice: resolvedPrice,
        contractId
    };
}
