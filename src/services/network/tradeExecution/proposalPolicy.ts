import { NetworkTradePolicyMode } from '@prisma/client';

export class ProposalPolicy {
    static getTenantPolicy(tenantId: string): NetworkTradePolicyMode {
        // Mock tenant policy resolution. In production, load from Tenant settings.
        return NetworkTradePolicyMode.SUGGEST_ONLY;
    }

    static assertTradeExecutionAllowed(tenantId: string, action: string) {
        const policy = this.getTenantPolicy(tenantId);

        switch (policy) {
            case 'DISCOVERY_ONLY':
                if (action !== 'DRAFT') throw new Error(`Action ${action} blocked by policy ${policy}`);
                break;
            case 'SUGGEST_ONLY':
                if (!['DRAFT', 'SUGGEST'].includes(action)) throw new Error(`Action ${action} blocked by policy ${policy}`);
                break;
            case 'AUTO_RFQ':
                if (!['DRAFT', 'SUGGEST', 'PROPOSE'].includes(action)) throw new Error(`Action ${action} blocked by policy ${policy}`);
                break;
            case 'AUTO_ROUTE':
                // All allowed
                break;
            default:
                throw new Error(`Unknown policy state: ${policy}`);
        }

        return true;
    }
}
