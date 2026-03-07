import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CapacityEstimator {

    static async estimateSupplierCapacity(tenantId: string, categoryId?: string) {
        console.log(`[CapacityEstimator] Recalculating capacity for ${tenantId}...`);

        // Mock algorithmic computation
        // Based on shipment throughput score and dispute rate 

        const throughputScore = Math.random() * 40 + 60; // 60-100
        const successRate = Math.random() * 20 + 80; // 80-100

        const capacity = await prisma.networkSupplierCapacity.create({
            data: {
                tenantId,
                categoryId: categoryId || 'CAT_LUBRICANTS',
                estimatedDailyCapacity: Math.floor(Math.random() * 50) + 10,
                estimatedWeeklyCapacity: Math.floor(Math.random() * 300) + 50,
                avgLeadTimeDays: Math.random() * 3 + 1, // 1-4 days
                shipmentThroughputScore: throughputScore,
                fulfillmentSuccessRate: successRate,
                capacityConfidenceScore: (throughputScore + successRate) / 2,
                calculationVersion: '1.0.0',
                expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days
            }
        });

        return capacity;
    }

    static async refreshAllSupplierCapacities() {
        const suppliers = [
            "TENANT_OVERSTOCK_SUPPLIER_01",
            "TENANT_SUPPLIER_02",
            "TENANT_SUPPLIER_LUBRICANTS"
        ];

        let processed = 0;
        for (const s of suppliers) {
            const existing = await prisma.networkSupplierCapacity.findFirst({ where: { tenantId: s } });
            if (existing) {
                await prisma.networkSupplierCapacity.delete({ where: { id: existing.id } });
            }
            await this.estimateSupplierCapacity(s);
            processed++;
        }
        return processed;
    }
}
