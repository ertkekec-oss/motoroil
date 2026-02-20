const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function testHB() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authHeader = `Basic ${Buffer.from(settings.merchantId + ':' + settings.password).toString('base64')}`;
    const merchantId = settings.merchantId.trim();
    const baseUrl = 'https://oms-external.hepsiburada.com';

    // Hardcoded from previous inspection
    const pkgNo = "5437154754";

    const variations = [
        `${baseUrl}/packages/merchantid/${merchantId}/packagenumber/${pkgNo}/labels?format=PDF`,
        `${baseUrl}/packages/merchantid/${merchantId}/labels?packageNumber=${pkgNo}&format=PDF`
    ];

    let out = `Testing with Package: ${pkgNo}\n\n`;

    for (const url of variations) {
        out += `TRYING: ${url}\n`;
        const r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test' } });
        out += `Status: ${r.status}\nContentType: ${r.headers.get('content-type')}\n`;
        if (r.ok) {
            out += `SUCCESS! Body length: ${(await r.arrayBuffer()).byteLength}\n`;
        } else {
            out += `FAILED: ${await r.text()}\n`;
        }
        out += '-------------------\n';
    }

    fs.writeFileSync('scripts/hb-final-test.txt', out);
}

testHB().catch(console.error).finally(() => prisma.$disconnect());
