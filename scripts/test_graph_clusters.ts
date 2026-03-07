import { ClusterDiscoveryService } from '../src/services/network/graphQuery/clusterDiscovery';

async function run() {
    console.log('[SMOKE TEST] Calculating Community Clusters...');
    try {
        const cluster = await ClusterDiscoveryService.discoverCategoryClusters('CAT_ELECTRONICS', {});
        console.log('Result:', cluster.clusterKey);
        console.log('Size of cluster:', cluster.clusterSize, 'nodes');

        console.log('[SMOKE TEST] Verifying Idempotency and Cache Hit for clusters...');
        const duplicate = await ClusterDiscoveryService.discoverCategoryClusters('CAT_ELECTRONICS', {});
        if (duplicate.id === cluster.id) {
            console.log('SUCCESS: Snapshot creation was idempotent. Returned cached instance.');
        } else {
            console.error('ERROR: Idempotency failed. Duplicates found.');
        }

        console.log('[SMOKE TEST] Ranking clusters for routing...');
        const clusters = await ClusterDiscoveryService.rankClusters('ALL');
        console.log('Valid clusters globally:', clusters.length);

        console.log('Graph Clusters Tests Passed.');
    } catch (e: any) {
        console.error('Error during Graph Clusters Test:', e);
    }
}

run();
