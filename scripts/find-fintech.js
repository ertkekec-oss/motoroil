const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
    let out = "";
    try {
        const tyConfig = await prisma.marketplaceConfig.findFirst({
            where: { type: 'trendyol', deletedAt: null }
        });
        const settings = typeof tyConfig.settings === 'string' ? JSON.parse(tyConfig.settings) : tyConfig.settings;
        
        const endDate = Date.now();
        const startDate = endDate - 90 * 24 * 60 * 60 * 1000;
        const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
        
        const urlSales = `https://apigw.trendyol.com/integration/finance/che/sellers/${settings.supplierId}/settlements?startDate=${startDate}&endDate=${endDate}&transactionType=Sale&orderNumber=11069830379`;
        out += `Trendyol Sales URL: ${urlSales}\n`;
        let resTy = await fetch(urlSales, { headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': `${settings.supplierId} - SelfIntegration` } });
        out += `TY Sales Status: ${resTy.status}\n`;
        out += `TY Sales JSON: ${await resTy.text()}\n\n`;

        const urlDed = `https://apigw.trendyol.com/integration/finance/che/sellers/${settings.supplierId}/other-financial-deductions?startDate=${startDate}&endDate=${endDate}&orderNumber=11069830379`;
        out += `Trendyol Ded URL: ${urlDed}\n`;
        let resTyDed = await fetch(urlDed, { headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': `${settings.supplierId} - SelfIntegration` } });
        out += `TY Deductions Status: ${resTyDed.status}\n`;
        out += `TY Deductions JSON: ${await resTyDed.text()}\n\n`;

        const hbConfig = await prisma.marketplaceConfig.findFirst({
            where: { type: 'hepsiburada', deletedAt: null }
        });
        const settingsHb = typeof hbConfig.settings === 'string' ? JSON.parse(hbConfig.settings) : hbConfig.settings;
        const hbUrl = `https://mpop-api.hepsiburada.com/finances/settlements?orderuid=4281248337&merchantId=${settingsHb.merchantId || settingsHb.merchantId}` ;
        const hbAuthHeader = `Basic ${Buffer.from(settingsHb.apiKey + ':' + settingsHb.apiSecret).toString('base64')}`;
        out += `HB Sales URL: ${hbUrl}\n`;
        let resHb = await fetch(hbUrl, { headers: { 'Authorization': hbAuthHeader } });
        out += `HB Sales Status: ${resHb.status}\n`;
        out += `HB JSON: ${await resHb.text()}\n`;

    } catch (e) {
        out += `Error: ${e.message}\n`;
    } finally {
        fs.writeFileSync('test-fintech-output.txt', out);
        await prisma.$disconnect();
    }
}

run();
