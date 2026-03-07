import { LiquidityEngine } from '../src/services/network/liquidity/liquidityEngine';

async function main() {
    console.log('🔄 Starting Liquidity Processing Test...');

    try {
        const result = await LiquidityEngine.processLiquidityMatches();
        console.log(`✅ Liquidity matches generated:`, result);
    } catch (e: any) {
        console.error('❌ Match generation failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
