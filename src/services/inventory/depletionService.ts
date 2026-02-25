import { prisma } from "@/lib/prisma";
import crypto from 'crypto';
import { calculateAvailableInventory } from "@/lib/inventory";

export async function runDepletionScan(companyId: string) {
    const policy = await prisma.sellerAutomationPolicy.findUnique({
        where: { sellerCompanyId: companyId }
    });

    const thresholdDays = policy?.understockThresholdDays || 7;

    // We get all computed consumption records
    const records = await prisma.productConsumption.findMany({
        where: { companyId }
    });

    let count = 0;

    for (const consumption of records) {
        // Resolve exactly how much on-hand stock the company has for this global product.
        // We find the ERP products mapped to this global product via NetworkListing or CompanyProductMap.
        const productListings = await prisma.networkListing.findMany({
            where: {
                sellerCompanyId: companyId,
                globalProductId: consumption.globalProductId
            },
            include: { erpProduct: true }
        });

        const productIds = productListings.map(l => l.erpProductId).filter(Boolean) as string[];

        // If no listings, check direct products (assuming standard schema match)
        let totalAvailableQty = 0;
        if (productIds.length > 0) {
            for (const pid of productIds) {
                const product = await prisma.product.findUnique({ where: { id: pid } });
                totalAvailableQty += (product?.stock || 0);
            }
        }

        const daysRemaining = consumption.dailyRate > 0 ? totalAvailableQty / consumption.dailyRate : 9999;

        if (daysRemaining <= thresholdDays) {
            // Check Network for Sellers supplying this GlobalProduct
            const networkSellers = await prisma.networkListing.findMany({
                where: {
                    globalProductId: consumption.globalProductId,
                    status: "ACTIVE",
                    sellerCompanyId: { not: companyId },
                },
                select: {
                    availableQty: true,
                    minQty: true,
                    sellerCompanyId: true,
                    price: true
                },
                orderBy: {
                    price: "asc"
                }
            });

            // Filter sellers that have enough qty
            const validSellers = networkSellers.filter(s => s.availableQty >= (s.minQty || 1));
            const hasSellerForBuy = validSellers.length > 0;

            const todayStr = new Date().toISOString().split('T')[0];
            const actionType = hasSellerForBuy ? "BUY_SUGGESTION" : "RFQ_SUGGESTION";
            const dedupeKey = `${companyId}:${consumption.globalProductId}:${actionType}:${todayStr}`;

            const existing = await prisma.buySuggestion.findUnique({ where: { dedupeKey } });
            if (existing && existing.status !== 'OPEN') continue;

            const upserted = await prisma.buySuggestion.upsert({
                where: { dedupeKey },
                create: {
                    buyerCompanyId: companyId,
                    globalProductId: consumption.globalProductId,
                    daysRemaining,
                    availableQty: totalAvailableQty,
                    status: "OPEN",
                    dedupeKey
                },
                update: {
                    daysRemaining,
                    availableQty: totalAvailableQty,
                    updatedAt: new Date()
                }
            });

            await prisma.automationDecisionLog.create({
                data: {
                    sellerCompanyId: companyId,
                    variantId: consumption.globalProductId,
                    rule: "UNDERSTOCK_RISK",
                    checksJson: {
                        availabilityCheck: hasSellerForBuy,
                        totalValidSellers: validSellers.length,
                        consumptionRate: consumption.dailyRate,
                        daysRemaining,
                        availableQty: totalAvailableQty,
                        thresholdDays
                    },
                    decision: actionType
                }
            });
            count++;
        }
    }

    console.log(`[DepletionService] Generated/Updated ${count} understock risks for buyer ${companyId}.`);
    return { success: true, count };
}
