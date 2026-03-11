const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testPdfLabelFormat() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    const trk = '7330031064550009'; // Pkg 3679014643
    // Trying the same package that was failing with ZPL

    const url4 = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/${trk}`;
    out += `\nPOST ${url4} (PDF format)\n`;
    let r = await fetch(url4, { 
        method: 'POST', 
        headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: "PDF", boxQuantity: 1 })
    });
    out += `Status: ${r.status}\n`;
    let text = await r.text();
    out += `Body: ${text}\n`;

    out += "Waiting 3s for generation...\n";
    await new Promise(res => setTimeout(res, 3000));
    
    out += `\nGET ${url4}\n`;
    r = await fetch(url4, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
    text = await r.text();
    out += `Body length: ${text.length}\n`;
    out += `Snippet: ${text.substring(0, 500)}\n`;
    
    // Testing another working order for PDF 11029796559 -> 7330030985495024
    const url5 = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/7330030985495024`;
    out += `\n\n=== WORKING ORDER ===\n`;
    out += `GET ${url5}\n`;
    r = await fetch(url5, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
    out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
    text = await r.text();
    out += `Body length: ${text.length}\n`;
    out += `Snippet: ${text.substring(0, 500)}\n`;

    fs.writeFileSync('scripts/trendyol-pdf-test2.txt', out, 'utf-8');
}

testPdfLabelFormat().catch(console.error).finally(() => prisma.$disconnect());
