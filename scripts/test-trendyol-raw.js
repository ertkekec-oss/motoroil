const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testPdfLabelRaw() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    const pkgId = 3679014643;

    const urls = [
        `https://apigw.trendyol.com/integration/order/sellers/${supp}/shipment-packages/${pkgId}/label`,
        `https://api.trendyol.com/sapigw/integration/order/sellers/${supp}/shipment-packages/${pkgId}/label`,
        `https://stageapigw.trendyol.com/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`,
    ];

    for (const u of urls) {
        out += `GET ${u}\n`;
        try {
            const r = await fetch(u, { headers: { 'Authorization': authHeader } });
            out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
            let text = await r.text();
            out += `Snippet: ${text.substring(0, 200)}\n\n`;
        } catch (e) {
            out += `Error: ${e.message}\n\n`;
        }
    }
    fs.writeFileSync('scripts/trendyol-raw-test.txt', out, 'utf-8');
}

testPdfLabelRaw().catch(console.error).finally(() => prisma.$disconnect());
