import { NeighborhoodService } from './neighborhoodService';
import { ClusterDiscoveryService } from './clusterDiscovery';
import { GraphAuditService } from './graphAudit';
import { GraphExplainService } from './graphExplain';
import { GraphQueryActorType, GraphQueryType } from '@prisma/client';

export interface GraphQueryInput {
    tenantId?: string;
    actorType: GraphQueryActorType;
    queryType: GraphQueryType;
    filters: any;
    requireExplain: boolean;
    preferCache: boolean;
    allowFallback: boolean;
}

export class GraphQueryEngine {
    /**
     * Main entrypoint for the Trade Graph Query Engine.
     * Connects materializations, cache, and audits.
     */
    static async runGraphQuery(input: GraphQueryInput) {
        const startTime = Date.now();
        let result: any = null;
        let explanation: any = null;
        let hitCache = false;

        try {
            if (input.queryType === 'NEIGHBORHOOD_LOOKUP') {
                result = await NeighborhoodService.getNeighborhoodSummary(input.tenantId!, '1-HOP');
                if (result) {
                    hitCache = true;
                } else if (input.allowFallback) {
                    result = await NeighborhoodService.buildNeighborhoodSnapshot(input.tenantId!, '1-HOP', input.filters);
                }
                explanation = input.requireExplain ? GraphExplainService.explainNeighborhoodResult(result) : null;
            }
            else if (input.queryType === 'SUPPLIER_NEIGHBORHOOD') {
                result = await this.runSupplierNeighborhoodQuery(input.tenantId!, input.filters);
                // Simulate cache miss and fallback
            }
            else if (input.queryType === 'CATEGORY_CLUSTER_DISCOVERY' || input.queryType === 'REGION_CLUSTER_DISCOVERY') {
                result = await this.runClusterDiscoveryQuery(input.filters.categoryId, input.filters.regionCode);
                hitCache = true; // Assume rankClusters always hits a pre-computed view
                explanation = input.requireExplain && Array.isArray(result) ? result.map(c => GraphExplainService.explainClusterResult(c)) : null;
            }
            else if (input.queryType === 'GRAPH_PROXIMITY_SEARCH') {
                result = await this.runGraphProximityQuery(input.tenantId!, input.filters);
            }

            const duration = Date.now() - startTime;

            // Audit Execution
            if (hitCache) {
                await GraphAuditService.recordCacheHit(input.tenantId || 'SYSTEM', input.queryType, input.filters, duration);
            } else {
                const count = Array.isArray(result) ? result.length : (result ? 1 : 0);
                await GraphAuditService.recordFallbackExecution(input.tenantId || 'SYSTEM', input.queryType, input.filters, duration, count);
            }

            return {
                success: true,
                results: result,
                explanation,
                metadata: {
                    executionTimeMs: duration,
                    cacheHit: hitCache,
                    mode: hitCache ? 'CACHE_ONLY' : 'CACHE_WITH_FALLBACK'
                }
            };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    static async runSupplierNeighborhoodQuery(tenantId: string, filters: any) {
        return await NeighborhoodService.findBestNeighborhoodSuppliers(tenantId, filters);
    }

    static async runClusterDiscoveryQuery(categoryId?: string, regionCode?: string) {
        return await ClusterDiscoveryService.rankClusters('ALL');
    }

    static async runGraphProximityQuery(tenantId: string, filters: any) {
        // Demo implementation for Proximity Weighted Search
        // Connects Trust, Shipping Reliability, and Hop Distance
        const neighbors = await NeighborhoodService.findBestNeighborhoodSuppliers(tenantId, filters);

        // Sort logic weighted by Trust and Shipping metrics from previous layer
        return neighbors; // Return raw list for demo. Final implementation combines the metrics.
    }
}
