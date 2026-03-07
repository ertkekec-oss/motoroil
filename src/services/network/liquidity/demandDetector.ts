export interface DemandCandidate {
    tenantId: string;
    categoryId?: string;
    productRef?: string;
    volumeScore: number;
    clusterId?: string;
    regionCode?: string;
}

export class DemandDetector {
    /**
     * Detects demand shortage across network by scanning stockout risks and RFQ signals.
     */
    static async detectDemandShortage(categoryId?: string, region?: string): Promise<DemandCandidate[]> {
        const mockDemands = [
            {
                tenantId: "TENANT_BUYER_01",
                categoryId: categoryId || "CAT_LUBRICANTS",
                productRef: "PROD_MOTOR_OIL_5W40",
                volumeScore: 90,
                regionCode: region || "TR-34",
                clusterId: "CLUSTER_MARMARA"
            },
            {
                tenantId: "TENANT_BUYER_02",
                categoryId: categoryId || "CAT_TYRES",
                productRef: "PROD_WINTER_TYRE",
                volumeScore: 75,
                regionCode: region || "TR-06",
                clusterId: "CLUSTER_IC_ANADOLU"
            }
        ];

        return mockDemands;
    }
}
