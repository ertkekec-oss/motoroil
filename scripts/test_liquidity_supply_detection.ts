import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';

async function main() {
    console.log('🔄 Starting Liquidity Supply Scanner Test...');

    try {
        const count = await LiquidityEngine.scanAndLogSupply();
        console.log(`✅ Supply scan completed. Simulated count: ${count}`);
    } catch (e: any) {
        console.error('❌ Supply scan failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
