const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testHB() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    if (!config) return console.log('HB config not found');
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.merchantId}:${settings.password}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const merchantId = settings.merchantId.trim();

    const baseUrl = 'https://oms-external.hepsiburada.com';

    // 1. Get a valid package number from delivered orders
    const deliveredUrl = `${baseUrl}/packages/merchantid/${merchantId}/delivered?limit=5`;
    console.log(`Fetching: ${deliveredUrl}`);
    const res = await fetch(deliveredUrl, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test', 'Accept': 'application/json' } });
    const data = await res.json();
    const items = data.items || data;

    if (!Array.isArray(items) || items.length === 0) {
        return console.log('No delivered orders found to test labels.');
    }

    const pkg = items[0];
    const pkgNo = pkg.packageNumber || pkg.id;
    const ordNo = pkg.orderNumber || (pkg.OrderNumbers && pkg.OrderNumbers[0]);

    console.log(`Testing with Package: ${pkgNo}, Order: ${ordNo}`);

    const variations = [
        `${baseUrl}/packages/merchantid/${merchantId}/packagenumber/${pkgNo}/labels?format=PDF`,
        `${baseUrl}/packages/merchantid/${merchantId}/packagenumbers/${pkgNo}/labels?format=PDF`,
        `${baseUrl}/packages/merchantid/${merchantId}/labels?packageNumber=${pkgNo}&format=PDF`,
        `${baseUrl}/packages/merchantid/${merchantId}/labels?packageNumbers=${pkgNo}&format=PDF`,
        `${baseUrl}/labels/merchantid/${merchantId}/packagenumber/${pkgNo}?format=PDF`,
        `${baseUrl}/packages/merchantid/${merchantId}/packagenumber/${pkgNo}/labels`
    ];

    let out = `Testing with Package: ${pkgNo}, Order: ${ordNo}\n\n`;

    for (const url of variations) {
        out += `TRYING: ${url}\n`;
        try {
            const r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test' } });
            out += `Status: ${r.status}\nContentType: ${r.headers.get('content-type')}\n`;
            if (r.ok) {
                out += `SUCCESS! Body length: ${(await r.arrayBuffer()).byteLength}\n`;
            } else {
                out += `FAILED: ${await r.text()}\n`;
            }
        } catch (e) {
            out += `ERROR: ${e.message}\n`;
        }
        out += '-------------------\n';
    }

    fs.writeFileSync('scripts/hb-label-test.txt', out);
    console.log('Results written to scripts/hb-label-test.txt');
}

testHB().catch(console.error).finally(() => prisma.$disconnect());
