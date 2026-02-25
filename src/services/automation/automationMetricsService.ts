import { prisma } from "@/lib/prisma";
import { SuggestionStatus } from "@prisma/client";

export async function getAutomationMetrics(sellerCompanyId: string, daysBack: number = 7) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysBack);

    // 1. AUTO_APPLIED listing'leri bul (son X günde)
    const autoAppliedSuggestions = await prisma.b2BSuggestion.findMany({
        where: {
            sellerCompanyId,
            status: SuggestionStatus.AUTO_APPLIED,
            updatedAt: { gte: periodStart }
        },
        select: {
            productId: true, // We map this to listing's erpProductId
        }
    });

    const erpProductIds = autoAppliedSuggestions.map(s => s.productId).filter(Boolean) as string[];

    const automationListingsAutoAppliedWTD = erpProductIds.length;

    // Find the listings for these products
    const listings = await prisma.networkListing.findMany({
        where: {
            sellerCompanyId,
            erpProductId: { in: erpProductIds }
        },
        select: { id: true }
    });

    const listingIds = listings.map(l => l.id);

    // 2. Bu listingId’lere bağlı orderItem’ları çek
    const orderItems = await prisma.networkOrderItem.findMany({
        where: {
            listingId: { in: listingIds },
            createdAt: { gte: periodStart }
        },
        include: {
            order: true
        }
    });

    // 3. KPI'lar
    let automationRevenueWTD = 0;
    const orderIds = new Set<string>();
    const listingIdsWithOrders = new Set<string>();

    for (const item of orderItems) {
        if (item.order.status !== 'CANCELLED' && item.order.status !== 'REJECTED') {
            automationRevenueWTD += Number(item.total);
            orderIds.add(item.networkOrderId);
            if (item.listingId) {
                listingIdsWithOrders.add(item.listingId);
            }
        }
    }

    const automationOrdersWTD = orderIds.size;
    const automationConversionRateWTD = automationListingsAutoAppliedWTD > 0
        ? Math.round((listingIdsWithOrders.size / automationListingsAutoAppliedWTD) * 100)
        : 0;

    return {
        automationRevenueWTD,
        automationOrdersWTD,
        automationListingsAutoAppliedWTD,
        automationConversionRateWTD
    };
}
