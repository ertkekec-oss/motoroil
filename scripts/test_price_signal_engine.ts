import { PriceSignalEngine } from '../src/services/network/pricing/priceSignalEngine';

async function main() {
    console.log('🔄 Starting Price Signal Generation Test...');

    try {
        const count = await PriceSignalEngine.generateCategoryPriceSignals();
        console.log(`✅ Price signals updated successfully. Count: ${count}`);
    } catch (e: any) {
        console.error('❌ Price Signal generation failed:', e.message);
    }
}

main().catch(console.error).finally(() => process.exit(0));
