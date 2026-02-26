import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { DiscoveryRequestLogData } from './types';

const prisma = new PrismaClient();

export function generateQueryHash(params: any): string {
    const input = JSON.stringify({
        viewerTenantId: params.viewerTenantId,
        filters: params.filters || {},
        sortMode: params.sortMode || '',
        limit: params.limit || 20,
        cursor: params.cursor || null,
        weightsVersion: params.weightsVersion || 'F3.1-v1'
    });
    return createHash('sha256').update(input).digest('hex');
}

export async function logDiscoveryRequest(data: DiscoveryRequestLogData) {
    try {
        await prisma.discoveryRequestLog.create({
            data: {
                viewerTenantId: data.viewerTenantId,
                requestId: data.requestId,
                queryHash: data.queryHash,
                weightsVersion: data.weightsVersion,
                filtersJson: data.filtersJson,
                sortMode: data.sortMode,
                limit: data.limit,
                latencyMs: data.latencyMs,
                dbLatencyMs: data.dbLatencyMs,
                computeLatencyMs: data.computeLatencyMs,
                resultsCount: data.resultsCount,
                topResultsJson: data.topResultsJson
            }
        });
    } catch (e) {
        console.error('Failed to write DiscoveryRequestLog', e);
    }
}
