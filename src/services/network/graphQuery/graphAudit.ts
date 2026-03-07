import { PrismaClient, GraphQueryActorType, GraphQueryType, GraphQueryExecutionMode } from '@prisma/client';

const prisma = new PrismaClient();

function hashQuery(input: any) {
    // Demo string hash logic. For a real system we might use crypto.createHash
    return `hash_${JSON.stringify(input.filters).length}_${input.tenantId}`;
}

export class GraphAuditService {

    static async recordGraphQueryAudit(input: {
        tenantId?: string;
        actorType: GraphQueryActorType;
        queryType: GraphQueryType;
        filters: any;
        resultCount: number;
        executionMode: GraphQueryExecutionMode;
        durationMs: number;
        cacheHit: boolean;
    }) {
        return await prisma.graphQueryAuditLog.create({
            data: {
                tenantId: input.tenantId,
                actorType: input.actorType,
                queryType: input.queryType,
                filtersJson: input.filters || {},
                resultCount: input.resultCount,
                executionMode: input.executionMode,
                cacheHit: input.cacheHit,
                durationMs: input.durationMs,
                createdAt: new Date(),
            }
        });
    }

    static async recordCacheHit(tenantId: string, queryType: GraphQueryType, filters: any, ms: number) {
        return this.recordGraphQueryAudit({
            tenantId,
            actorType: 'TENANT',
            queryType,
            filters,
            resultCount: 1,
            executionMode: 'CACHE_ONLY',
            durationMs: ms,
            cacheHit: true
        });
    }

    static async recordFallbackExecution(tenantId: string, queryType: GraphQueryType, filters: any, ms: number, count: number) {
        return this.recordGraphQueryAudit({
            tenantId,
            actorType: 'TENANT',
            queryType,
            filters,
            resultCount: count,
            executionMode: 'CACHE_WITH_FALLBACK',
            durationMs: ms,
            cacheHit: false
        });
    }
}
