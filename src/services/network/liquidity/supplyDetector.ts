import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SupplyCandidate {
    tenantId: string;
    categoryId?: string;
    productRef?: string;
    volumeScore: number;
    clusterId?: string;
    regionCode?: string;
}

export class SupplyDetector {
    /**
     * Detects supply surplus across the network by scanning inventory signals and overstock risks.
     */
    static async detectSupplySurplus(categoryId?: string, region?: string): Promise<SupplyCandidate[]> {
        // Mock logic for prototype. Represents detecting slow moving inventory, high capacity suppliers, etc.
        const mockSupplies = [
            {
                tenantId: "TENANT_OVERSTOCK_SUPPLIER_01",
                categoryId: categoryId || "CAT_LUBRICANTS",
                productRef: "PROD_MOTOR_OIL_5W40",
                volumeScore: 85,
                regionCode: region || "TR-34",
                clusterId: "CLUSTER_MARMARA"
            },
            {
                tenantId: "TENANT_SUPPLIER_02",
                categoryId: categoryId || "CAT_SPARE_PARTS",
                productRef: "PROD_BRAKE_PAD",
                volumeScore: 60,
                regionCode: region || "TR-06",
                clusterId: "CLUSTER_IC_ANADOLU"
            }
        ];

        return mockSupplies;
    }
}
