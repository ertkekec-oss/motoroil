const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testBoxQuantity() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    
    // The failing package SERKAN KILCI
    const trk = '7330031064550009'; 
    
    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
    
    out += `POSTing with NO volumetric height, and boxQuantity = 1\n`;
    let r = await fetch(url, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: "ZPL", boxQuantity: 1 })
    });
    out += `Status: ${r.status}\n`;
    let text = await r.text();
    out += `Response: ${text}\n`;

    out += `POSTing with ONLY format ZPL\n`;
    r = await fetch(url, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: "ZPL" })
    });
    out += `Status: ${r.status}\n`;
    text = await r.text();
    out += `Response: ${text}\n`;

    fs.writeFileSync('scripts/trendyol-boxQ-test.txt', out, 'utf-8');
}

testBoxQuantity().catch(console.error).finally(() => prisma.$disconnect());
