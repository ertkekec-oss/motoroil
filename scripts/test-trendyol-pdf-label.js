const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testPdfLabel() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    const pkgId = 3679014643;

    // The endpoint our system uses
    const url = `https://apigw.trendyol.com/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`;
    out += `GET ${url}\n`;
    let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Accept': 'application/pdf' } });
    out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
    
    // There is an older, alternative URL structure according to some docs
    const url2 = `https://api.trendyol.com/sapigw/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`;
    out += `\nGET ${url2}\n`;
    r = await fetch(url2, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Accept': 'application/pdf' } });
    out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
    
    // What about trying it as JSON?
    const url3 = `https://apigw.trendyol.com/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`;
    out += `\nGET ${url3} (Accept JSON)\n`;
    r = await fetch(url3, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Accept': 'application/json' } });
    out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
    let text = await r.text();
    out += `Body: ${text}\n`;
    
    // And what about passing format=A4 on the Common Label API? Wait, Common Label API endpoint uses tracking number, not package id.
    const trk = '7330031064550009';
    // Is there a format query param? "Ortak barkod süreci" format is ZPL. Is format=PDF/A4 possible?
    const url4 = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
    out += `\nPOST ${url4} (A4 format)\n`;
    r = await fetch(url4, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: "A4", boxQuantity: 1 })
    });
    out += `Status: ${r.status}\n`;
    text = await r.text();
    out += `Body: ${text}\n`;

    fs.writeFileSync('scripts/trendyol-pdf-test.txt', out, 'utf-8');
}

testPdfLabel().catch(console.error).finally(() => prisma.$disconnect());
