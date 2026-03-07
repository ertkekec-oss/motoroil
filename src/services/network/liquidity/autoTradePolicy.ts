export class AutoTradePolicy {
    static getTenantPolicy(tenantId: string) {
        // Mock tenant policy resolution
        // Modes: DISCOVERY_ONLY, SUGGEST_ONLY, AUTO_RFQ, AUTO_ROUTE
        return 'SUGGEST_ONLY';
    }

    static assertLiquidityActionAllowed(tenantId: string, action: string) {
        const policy = this.getTenantPolicy(tenantId);

        switch (policy) {
            case 'DISCOVERY_ONLY':
                if (action !== 'DISCOVER') throw new Error(`Action ${action} blocked by policy ${policy}`);
                break;
            case 'SUGGEST_ONLY':
                if (!['DISCOVER', 'SUGGEST'].includes(action)) throw new Error(`Action ${action} blocked by policy ${policy}`);
                break;
            case 'AUTO_RFQ':
                if (!['DISCOVER', 'SUGGEST', 'AUTO_RFQ'].includes(action)) throw new Error(`Action ${action} blocked by policy ${policy}`);
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
