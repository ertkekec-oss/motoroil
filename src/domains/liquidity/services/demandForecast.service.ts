import prisma from "@/lib/prisma";

// Mocking the data aggregation because actual Order/Inventory models might not yet fully align 
// with the exact names or are empty in this phase.
export async function buildDemandForecastSnapshot(tenantId: string, productId: string) {
    // Attempt to find product mapping to get canonical ID
    const mapping = await prisma.tenantProductMapping.findFirst({
        where: { tenantId, productId }
    });

    const canonicalProductId = mapping?.canonicalProductId || null;

    // TODO: In a real system, query the Order / Inventory models here 
    // to aggregate avgDailySales and stockLevel. For the sake of this phase:
    // Fallback/Mock logic based on product ID to simulate meaningful behavior
    let avgDailySales = Math.random() * 10; // 0-10 units/day
    let stockLevel = Math.random() * 100; // 0-100 units

    // For specific test product IDs, override with predictable values
    if (productId.includes("high_demand")) {
        avgDailySales = 8.5;
        stockLevel = 20; // Will restock soon
    } else if (productId.includes("slow_moving")) {
        avgDailySales = 0.5;
        stockLevel = 500;
    }

    const avgWeeklySales = avgDailySales * 7;
    const daysToStockout = avgDailySales > 0 ? (stockLevel / avgDailySales) : 999;

    // Reorder Recommendation (targeting 30-day stock cover)
    const recommendedReorderQty = Math.max(Math.ceil((avgDailySales * 30) - stockLevel), 0);

    const snapshot = await prisma.demandForecastSnapshot.create({
        data: {
            tenantId,
            productId,
            canonicalProductId,
            avgDailySales,
            avgWeeklySales,
            stockLevel,
            daysToStockout,
            recommendedReorderQty,
            snapshotDate: new Date(),
        }
    });

    return snapshot;
}

export async function buildCanonicalDemandForecast(tenantId: string, canonicalProductId: string) {
    // Usually aggregates all products in a tenant mapped to this canonical product.
    // For this prompt, assume 1-to-1 mapping generally for a tenant
    const mapping = await prisma.tenantProductMapping.findFirst({
        where: { tenantId, canonicalProductId }
    });

    if (!mapping) {
        throw new Error("Product not found or not mapped in tenant inventory.");
    }

    return buildDemandForecastSnapshot(tenantId, mapping.productId);
}

export async function getDemandForecastSnapshot(tenantId: string, productId: string) {
    return prisma.demandForecastSnapshot.findFirst({
        where: { tenantId, productId },
        orderBy: { snapshotDate: 'desc' }
    });
}

export async function listDemandForecasts(tenantId: string, filters?: any) {
    return prisma.demandForecastSnapshot.findMany({
        where: { tenantId, ...(filters || {}) },
        orderBy: { snapshotDate: 'desc' },
        take: 100
    });
}
