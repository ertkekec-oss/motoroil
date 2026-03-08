import prisma from '@/lib/prisma';

export interface GrowthTriggerParams {
    tenantId?: string;
    buyerTenantId?: string;
    sellerTenantId?: string;
    canonicalProductId?: string;
    triggerType: string;
    triggerStrength: number;
    status?: string;
    metadataJson?: any;
}

export class NetworkGrowthTriggerService {
    static async createGrowthTrigger(params: GrowthTriggerParams) {
        // 🟢 Idempotency & RACE CONDITION KORUMASI 
        // Avoid duplicate triggers per scenario if one is still open
        const existing = await prisma.networkGrowthTrigger.findFirst({
            where: {
                buyerTenantId: params.buyerTenantId,
                sellerTenantId: params.sellerTenantId,
                canonicalProductId: params.canonicalProductId,
                triggerType: params.triggerType,
                status: 'OPEN'
            }
        });

        if (existing) {
            console.log(`[NetworkGrowth] Trigger already exists (OPEN) for ${params.triggerType}. Deduplication applied.`);
            return existing;
        }

        const trigger = await prisma.networkGrowthTrigger.create({
            data: {
                ...params,
                status: params.status || 'OPEN'
            }
        });

        // Optionally create actions based on trigger type immediately
        await this.createGrowthActionsForTrigger(trigger.id);
        return trigger;
    }

    static async createGrowthActionsForTrigger(triggerId: string) {
        const trigger = await prisma.networkGrowthTrigger.findUnique({ where: { id: triggerId } });
        if (!trigger) return;

        let actionType = 'GENERIC_REVIEW';

        switch (trigger.triggerType) {
            case 'TRADE_COMPLETED_BUYER_EXPANSION':
                actionType = 'SUPPLIER_DISCOVERY_CANDIDATES';
                break;
            case 'TRADE_COMPLETED_SUPPLIER_EXPANSION':
                actionType = 'BUYER_DISCOVERY_CANDIDATES';
                break;
            case 'HIGH_DEMAND_SUPPLIER_DISCOVERY':
                actionType = 'NETWORK_INVITATION_READY';
                break;
            case 'HIGH_SUPPLY_BUYER_DISCOVERY':
                actionType = 'CATALOG_EXPANSION_RECOMMENDATION';
                break;
        }

        await prisma.networkGrowthAction.create({
            data: {
                triggerId,
                actionType,
                status: 'PENDING',
                payloadJson: { reason: "Auto-generated from trigger" }
            }
        });
    }

    static async listGrowthTriggers(filters: any = {}) {
        return prisma.networkGrowthTrigger.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    static async listGrowthActions(filters: any = {}) {
        return prisma.networkGrowthAction.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }
}
