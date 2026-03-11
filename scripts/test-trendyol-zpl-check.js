const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testZplCheck() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    if(!config) return console.error("Config not found");
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    const cargoTrackingNumber = '7330031064550009';
    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${cargoTrackingNumber}`;
    
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    let text = await r.text();
    console.log(`GET Status: ${r.status}`);
    console.log(`GET Response: ${text.substring(0, 500)}`);
}

testZplCheck().catch(console.error).finally(() => prisma.$disconnect());
