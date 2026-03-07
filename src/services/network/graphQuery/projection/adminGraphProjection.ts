import { CompanyGraphNeighborhoodSnapshot, CompanyGraphClusterSnapshot, GraphQueryAuditLog } from '@prisma/client';

export class AdminGraphProjection {
    static projectAuditLog(log: GraphQueryAuditLog) {
        return {
            id: log.id,
            tenantId: log.tenantId || 'SYSTEM',
            actorType: log.actorType,
            queryType: log.queryType,
            filters: log.filtersJson,
            resultCount: log.resultCount,
            executionMode: log.executionMode,
            cacheHit: log.cacheHit,
            latency: `${log.durationMs} ms`,
            timestamp: log.createdAt.toISOString()
        };
    }

    static projectAdminClusterView(cluster: CompanyGraphClusterSnapshot) {
        return {
            ...cluster,
            isStale: cluster.isStale,
            dedupeKey: cluster.dedupeKey,
            version: cluster.calculationVersion
        };
    }

    static projectAdminNeighborhoodView(snap: CompanyGraphNeighborhoodSnapshot) {
        return {
            ...snap,
            isStale: snap.isStale,
            dedupeKey: snap.dedupeKey,
            version: snap.calculationVersion
        }
    }
}
