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
    
    const url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?status=Created&size=10`;
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    let page = await r.json();
    
    if(!page || !page.content) return console.log("No content");
    
    const texOrders = page.content.filter(o => String(o.cargoProviderName).toLowerCase().includes('express'));
    out += `Found ${texOrders.length} TEX orders in Created status.\n`;
    
    for(let i=0; i<Math.min(texOrders.length, 2); i++) {
        const o = texOrders[i];
        out += `\nTesting TEX Order: ${o.orderNumber} - Pkg: ${o.shipmentPackageId}\n`;
        // 1. Update to Picking
        let putUrl = `https://apigw.trendyol.com/integration/order/sellers/${supp}/shipment-packages/${o.shipmentPackageId}`;
        const lines = o.lines.map(l => ({ lineId: l.id, quantity: l.quantity }));
        const putRes = await fetch(putUrl, { 
            method: 'PUT', 
            headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lines, params: {}, status: 'Picking' })
        });
        out += `Update to Picking: ${putRes.status}\n`;
        
        // 2. Fetch fresh details
        let getUrl = `https://apigw.trendyol.com/integration/order/sellers/${supp}/orders?shipmentPackageIds=${o.shipmentPackageId}`;
        let getRes = await fetch(getUrl, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
        let getPkg = await getRes.json();
        let freshPkg = getPkg.content[0];
        let trk = freshPkg.cargoTrackingNumber;
        out += `Fresh tracking number: ${trk}\n`;
        
        if (trk) {
            // 3. Request common label
            let reqUrl = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
            let reqRes = await fetch(reqUrl, {
                method: 'POST',
                headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: "ZPL", boxQuantity: 1 }) // Or no body? Let's just pass empty object next time
            });
            out += `POST Common Label: ${reqRes.status}\n`;
            
            await new Promise(res => setTimeout(res, 2000));
            
            let chkRes = await fetch(reqUrl, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
            let chkText = await chkRes.text();
            out += `GET Common Label Status: ${chkRes.status}\n`;
            out += `Response snippet: ${chkText.substring(0, 150)}\n`;
        }
    }
    fs.writeFileSync('scripts/test-trendyol-other2.txt', out, 'utf-8');
}

testOthersFile().catch(console.error).finally(() => prisma.$disconnect());
