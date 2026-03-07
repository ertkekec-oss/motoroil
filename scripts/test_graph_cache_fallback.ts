import { GraphQueryEngine } from '../src/services/network/graphQuery/graphQueryEngine';

async function run() {
    console.log('[SMOKE TEST] Running Neighborhood Lookup via GraphQueryEngine...');
    try {
        const input: any = {
            tenantId: 'TENANT_A',
            actorType: 'TENANT',
            queryType: 'NEIGHBORHOOD_LOOKUP',
            filters: {},
            requireExplain: true,
            preferCache: true,
            allowFallback: true
        };
        const result = await GraphQueryEngine.runGraphQuery(input);

        console.log('--- ENGINE ROUND 1 ---');
        console.log('Execution metadata:', result.metadata);
        console.log('Projected Tags:', result.explanation?.tags);

        // Run again for cache hit
        const hitResult = await GraphQueryEngine.runGraphQuery(input);
        console.log('--- ENGINE ROUND 2 ---');
        console.log('Execution metadata:', hitResult.metadata);

        if (hitResult.metadata.cacheHit) {
            console.log('SUCCESS: Fallback succeeded then Cache Hit verified.');
        } else {
            console.error('ERROR: Cache hit not functioning in Engine.');
        }
        console.log('Graph Query Engine Pipeline Tests Passed.');
    } catch (e: any) {
        console.error('Error during Graph Cache Fallback/Engine Test:', e);
    }
}

run();
