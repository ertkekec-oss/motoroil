const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testZpl() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    if(!config) return console.error("Config not found");
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    const supp = settings.supplierId;
    const cargoTrackingNumber = '7330031064550009';

    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${cargoTrackingNumber}`;
    
    out += `GET ${url}\n`;
    
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    let text = await r.text();
    out += `GET Status: ${r.status}\n`;
    out += `GET Response: ${text.substring(0, 100)}\n`;
    
    if (r.status !== 200 || !text.includes('ZPL')) {
        const reqBody = {
            format: "ZPL",
            boxQuantity: 1
        };

        out += `\nPOST ${url}\n`;
        r = await fetch(url, { 
            method: 'POST', 
            headers: { 
                'Authorization': authHeader, 
                'User-Agent': `${supp} - SelfIntegration`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reqBody)
        });
        out += `POST Status: ${r.status}\n`;
        text = await r.text();
        out += `POST Response: ${text}\n`;
        
        out += "Waiting 3s...\n";
        await new Promise(res => setTimeout(res, 3000));
        
        out += `\nGET ${url}\n`;
        r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
        text = await r.text();
        out += `GET Status: ${r.status}\n`;
        out += `GET Response: ${text.substring(0, 200)}\n`;
    }
    
    fs.writeFileSync('scripts/trendyol-zpl.txt', out, 'utf-8');
}

testZpl().catch(console.error).finally(() => prisma.$disconnect());
