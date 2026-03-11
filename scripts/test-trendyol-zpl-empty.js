const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testZplEmpty() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    const cargoTrackingNumber = '7330031064550009';

    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${cargoTrackingNumber}`;
    
    out += `\nPOST ${url} (EMPTY BODY)\n`;
    let r = await fetch(url, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` }
    });
    out += `POST Status: ${r.status}\n`;
    let text = await r.text();
    out += `POST Response: ${text}\n`;
    
    out += "Waiting 5s...\n";
    await new Promise(res => setTimeout(res, 5000));
    
    out += `\nGET ${url}\n`;
    r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    text = await r.text();
    out += `GET Status: ${r.status}\n`;
    out += `GET Response: ${text}\n`;
    
    fs.writeFileSync('scripts/trendyol-zpl-empty.txt', out, 'utf-8');
}

testZplEmpty().catch(console.error).finally(() => prisma.$disconnect());
