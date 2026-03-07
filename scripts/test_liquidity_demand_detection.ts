import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';

async function main() {
    console.log('🔄 Starting Liquidity Demand Scanner Test...');

    try {
        const count = await LiquidityEngine.scanAndLogDemand();
        console.log(`✅ Demand scan completed. Simulated count: ${count}`);
    } catch (e: any) {
        console.error('❌ Demand scan failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
