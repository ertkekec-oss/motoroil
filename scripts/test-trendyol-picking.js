const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testOthersFile() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    
    // Look for Picking status
    const url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?status=Picking&size=20`;
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    let page = await r.json();
    
    if(!page || !page.content) return console.log("No content");
    
    const texOrders = page.content.filter(o => String(o.cargoProviderName).toLowerCase().includes('express'));
    out += `Found ${texOrders.length} TEX orders in Picking status.\n`;
    
    for(let i=0; i<Math.min(texOrders.length, 3); i++) {
        const o = texOrders[i];
        out += `\nTesting TEX Order: ${o.orderNumber} - Pkg: ${o.shipmentPackageId}\n`;
        let trk = o.cargoTrackingNumber;
        out += `Tracking number: ${trk}\n`;
        
        if (trk) {
            // Check if label exists
            let reqUrl = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
            let chkRes = await fetch(reqUrl, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
            let chkText = await chkRes.text();
            out += `GET Common Label Status: ${chkRes.status}\n`;
            out += `Response snippet: ${chkText.substring(0, 150)}\n`;
        }
    }
    fs.writeFileSync('scripts/test-trendyol-picking.txt', out, 'utf-8');
}

testOthersFile().catch(console.error).finally(() => prisma.$disconnect());
