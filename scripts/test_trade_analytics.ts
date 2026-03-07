import { TradeFlowAnalyzer } from '../src/services/network/analytics/tradeFlowAnalyzer';

async function main() {
    console.log('🔄 Starting Trade Flow Analytics Engine...');

    try {
        const count = await TradeFlowAnalyzer.buildTradeAnalyticsSnapshots();
        console.log(`✅ Trade Flow Snapshots built successfully. Count: ${count}`);
    } catch (e: any) {
        console.error('❌ Analytics Snapshot compilation failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
