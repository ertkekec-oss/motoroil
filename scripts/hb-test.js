const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testHB() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    if (!config) return console.log('HB config not found');
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.merchantId}:${settings.password}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    // Check packed, unpacked, delivered...
    const endpoints = [
        `https://oms-external.hepsiburada.com/orders/merchantid/${settings.merchantId}?limit=10`,
        `https://oms-external.hepsiburada.com/packages/merchantid/${settings.merchantId}/packed?limit=10`
    ];

    let out = '';
    let pkgNo = null;

    for (const url of endpoints) {
        const res = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test', 'Accept': 'application/json' } });
        if (res.ok) {
            const body = await res.json();
            const packages = body.items || body.data || body;
            if (Array.isArray(packages) && packages.length > 0) {
                pkgNo = packages[0].packageNumber || packages[0].id;
                out += `Found package in ${url}: ${pkgNo}\n`;
                break;
            }
        }
    }

    if (pkgNo) {
        const urls = [
            `https://oms-external.hepsiburada.com/packages/merchantid/${settings.merchantId}/packagenumber/${pkgNo}/labels`,
            `https://oms-external.hepsiburada.com/packages/merchantid/${settings.merchantId}/packagenumber/${pkgNo}/labels?format=PDF`
        ];

        for (const url of urls) {
            out += `\nGET ${url}\n`;
            const r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test', 'Accept': 'application/json' } });
            out += `Status: ${r.status}\nType: ${r.headers.get('content-type')}\n`;

            if (r.ok) {
                if (r.headers.get('content-type')?.includes('pdf')) {
                    out += 'BODY: [PDF DATA]\n';
                } else if (r.headers.get('content-type')?.includes('json')) {
                    out += `BODY: ${JSON.stringify(await r.json(), null, 2)}\n`;
                } else {
                    out += `BODY: ${await r.text()}\n`;
                }
            } else {
                out += `ERR: ${await r.text()}\n`;
            }
        }
    } else {
        out += 'No packages found anywhere.';
    }

    fs.writeFileSync('scripts/hb-out.txt', out);
}
testHB().catch(console.error).finally(() => prisma.$disconnect());
