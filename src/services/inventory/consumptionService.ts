import { prisma } from "@/lib/prisma";

export async function computeAllConsumptionRates() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all completed/delivered shipments in last 30 days
    const deliveredShipments = await prisma.shipment.findMany({
        where: {
            status: "DELIVERED",
            updatedAt: { gte: thirtyDaysAgo }
        },
        include: {
            order: {
                include: {
                    networkItems: true
                }
            }
        }
    });

    const consumptionMap: Record<string, Record<string, number>> = {};

    for (const ship of deliveredShipments) {
        const order = ship.order;
        if (!order) continue;

        const companyId = order.buyerCompanyId;
        if (!consumptionMap[companyId]) {
            consumptionMap[companyId] = {};
        }

        // Ideally, if shipment is partial, we look at shipment.items
        // For simplicity (as per MVP), we assume order items were fully delivered
        for (const item of order.networkItems) {
            if (item.globalProductId) {
                consumptionMap[companyId][item.globalProductId] = (consumptionMap[companyId][item.globalProductId] || 0) + item.qty;
            }
        }
    }

    let count = 0;
    // Persist
    for (const [companyId, products] of Object.entries(consumptionMap)) {
        for (const [gpId, totalQty] of Object.entries(products)) {
            const dailyRate = totalQty / 30.0;
            if (dailyRate > 0) {
                await prisma.productConsumption.upsert({
                    where: {
                        companyId_globalProductId: {
                            companyId,
                            globalProductId: gpId
                        }
                    },
                    create: {
                        companyId,
                        globalProductId: gpId,
                        dailyRate,
                        lastComputedAt: new Date()
                    },
                    update: {
                        dailyRate,
                        lastComputedAt: new Date()
                    }
                });
                count++;
            }
        }
    }

    console.log(`[ConsumptionService] Computed rates for ${count} product-company pairs.`);
    return { success: true, computedRecords: count };
}
