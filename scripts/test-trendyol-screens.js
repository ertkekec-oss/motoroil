const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testScreenshots() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    
    // Test the one that WORKS
    let url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?shipmentPackageIds=3680378496`;
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    let page = await r.json();
    let pkg1 = page.content[0];
    out += `\nWORKING (3680378496):\n`;
    out += `Provider: ${pkg1.cargoProviderName}\n`;
    out += `Tracking: ${pkg1.cargoTrackingNumber}\n`;

    // Test the one that FAILS
    url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?shipmentPackageIds=3675034675`;
    r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    page = await r.json();
    let pkg2 = page.content[0];
    out += `\nFAILING (3675034675):\n`;
    out += `Provider: ${pkg2.cargoProviderName}\n`;
    out += `Tracking: ${pkg2.cargoTrackingNumber}\n`;
    
    fs.writeFileSync('scripts/trendyol-screen-test.txt', out, 'utf-8');
}

testScreenshots().catch(console.error).finally(() => prisma.$disconnect());
