const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testLabel() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    let out = '';
    const pkgId = 3625495794;
    const supp = settings.supplierId;

    const urls = [
        `https://apigw.trendyol.com/integration/order/sellers/${supp}/shipment-packages/${pkgId}/label`,
        `https://apigw.trendyol.com/integration/order/sellers/${supp}/labels/${pkgId}`,
        `https://api.trendyol.com/sapigw/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`,
    ];

    for (const url of urls) {
        out += `\nGET ${url}\n`;
        try {
            const r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration` } });
            out += `Status: ${r.status} ${r.headers.get('content-type')}\n`;
            out += `BODY: ${await r.text()}\n`;
        } catch (e) {
            out += `Err: ${e.message}\n`;
        }
    }
    fs.writeFileSync('scripts/out9.txt', out);
}
testLabel().catch(console.error).finally(() => prisma.$disconnect());
