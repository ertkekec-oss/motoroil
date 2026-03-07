import { TradeAbuseDetector } from '../src/services/network/tradeSecurity/tradeAbuseDetector';

async function main() {
    console.log('🔄 Starting Trade Abuse Detection Testing...');

    try {
        const spam = await TradeAbuseDetector.scanForSpamAbuse('TENANT_BUYER_01');
        console.log(`🛡️ Spam detection result:`, spam);

        const manip = await TradeAbuseDetector.detectPriceManipulation('TENANT_BUYER_02');
        console.log(`🛡️ Price manipulation detected:`, manip);

        console.log(`✅ Abuse testing completed.`);
    } catch (e: any) {
        console.error('❌ Trade abuse detection failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
