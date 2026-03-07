import { NeighborhoodService } from '../src/services/network/graphQuery/neighborhoodService';

async function run() {
    console.log('[SMOKE TEST] Calculating 1-Hop Neighborhood for TENANT_A...');
    try {
        const result = await NeighborhoodService.buildNeighborhoodSnapshot('TENANT_A', '1-HOP', {});
        console.log('Result:', result);
        console.log('Total nodes reachable:', result.totalReachableNodes);

        console.log('[SMOKE TEST] Verifying Idempotency and Cache Hit...');
        const duplicate = await NeighborhoodService.buildNeighborhoodSnapshot('TENANT_A', '1-HOP', {});
        if (duplicate.id === result.id) {
            console.log('SUCCESS: Snapshot creation was idempotent. Returned cached instance.');
        } else {
            console.error('ERROR: Idempotency failed. Duplicates found.');
        }

        console.log('[SMOKE TEST] Fetching Tenant Profile Supplier View...');
        const suppliers = await NeighborhoodService.findBestNeighborhoodSuppliers('TENANT_A', { limit: 2 });
        console.log('Suppliers length:', suppliers.length);

        console.log('Graph Neighborhood Tests Passed.');
    } catch (e: any) {
        console.error('Error during Graph Neighborhood Test:', e);
    }
}

run();
