import { DiscoveryEngine } from '../src/services/network/discovery/discoveryEngine';

async function main() {
    console.log('🔄 Starting Network Discovery Profile Generator Test...');

    try {
        const count = await DiscoveryEngine.refreshDiscoveryProfiles();
        console.log(`✅ Discovery profiles generated successfully. Count: ${count}`);
    } catch (e: any) {
        console.error('❌ Network Discovery profiling failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
