import { TrendyolService } from '../src/services/marketplaces/trendyol';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
    const config = await prisma.marketplaceConfig.findFirst({
        where: { type: 'trendyol' }
    });
    const settings = typeof config!.settings === 'string' ? JSON.parse(config!.settings as string) : config!.settings;
    const srv = new TrendyolService(settings as any);
    
    // Testing with transactionType AND orderNumber AND DATES within 14 days
    const endDate = Date.now();
    const startDate = endDate - 14 * 24 * 60 * 60 * 1000; // 14 days
    
    let url = `${srv['baseUrl']}/integration/finance/che/sellers/${srv['config'].supplierId}/settlements?startDate=${startDate}&endDate=${endDate}&transactionType=Sale&orderNumber=11069830379`;
    console.log(url);
    const effectiveProxy = (process.env.MARKETPLACE_PROXY_URL || '').trim();
    const fetchUrl = effectiveProxy ? `${effectiveProxy}?url=${encodeURIComponent(url)}` : url;
    let response = await srv['safeFetchJson'](fetchUrl, { headers: srv['getHeaders']() });
    console.log(JSON.stringify(response, null, 2));
    
    process.exit(0);
}
main().catch(console.error);
