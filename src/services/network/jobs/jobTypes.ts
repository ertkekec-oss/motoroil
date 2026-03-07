export type NetworkJobType =
    | 'REBUILD_TRUST_SCORE'
    | 'REBUILD_RECOMMENDATIONS'
    | 'RECOMPUTE_GRAPH_CACHE'
    | 'ANALYZE_INVENTORY_SIGNALS'
    | 'GENERATE_TRADE_OPPORTUNITIES'
    | 'PREPARE_RFQ_ROUTING'
    | 'RECOMPUTE_MARKET_SIGNALS'
    | 'GENERATE_TENANT_MARKET_INSIGHTS'
    | 'RECOMPUTE_CATEGORY_HEAT'
    | 'RECOMPUTE_REGIONAL_SIGNALS'
    ;

export interface NetworkJobPayload {
    type: NetworkJobType;
    tenantId?: string;
    targetId?: string;
    params?: any;
}
