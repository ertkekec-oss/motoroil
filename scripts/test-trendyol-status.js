const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testStatus() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    if(!config) return console.error("Config not found");
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    const supp = settings.supplierId;
    const pkgId = '3679014643';

    const url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?shipmentPackageIds=${pkgId}`;
    
    console.log(`Fetching ${url}`);
    const r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    const data = await r.json();
    
    fs.writeFileSync('scripts/trendyol-status-out.json', JSON.stringify(data.content[0], null, 2), 'utf-8');
    console.log("Saved to trendyol-status-out.json");
}

testStatus().catch(console.error).finally(() => prisma.$disconnect());
