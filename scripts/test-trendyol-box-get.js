const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testBoxQuantityGet() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    
    // The failing package SERKAN KILCI
    const trk = '7330031064550009'; 
    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
    
    out += `GETting the label after the 200 POST...\n`;
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    out += `Status: ${r.status}\n`;
    let text = await r.text();
    out += `Response: ${text.substring(0, 300)}\n`;
    
    fs.writeFileSync('scripts/trendyol-boxQ-get-test.txt', out, 'utf-8');
}

testBoxQuantityGet().catch(console.error).finally(() => prisma.$disconnect());
